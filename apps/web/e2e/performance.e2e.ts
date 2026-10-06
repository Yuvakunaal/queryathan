import { writeFileSync } from "node:fs";
import type { Page } from "@playwright/test";
import { test, expect } from "./fixtures";
import { seed, titleOf } from "./helpers";

/**
 * Performance guards. The budgets are deliberately loose (several times what a
 * healthy machine needs) so a slow CI runner does not flake, and tight enough
 * that a regression such as a heavy dependency landing on the home page, an
 * engine loading before it is asked for, or parsing a big CSV on the main
 * thread fails here. Measured numbers are attached to each test's report.
 */

const WORLD = "boss-fights";
const CASE = "w1-01-nul-sentinel";

function record(name: string, value: number): void {
  test.info().annotations.push({
    type: "perf",
    description: `${name}: ${String(Math.round(value))}`,
  });
}

/** Counts main-thread tasks over 50 ms (the browser's definition of a long task). */
async function trackLongTasks(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const longTasks: number[] = [];
    Object.assign(window, { __longTasks: longTasks });
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) longTasks.push(entry.duration);
      }).observe({ type: "longtask", buffered: true });
    } catch {
      // Not supported: the long-task checks are skipped.
    }
  });
}

async function longestTask(page: Page): Promise<number> {
  return page.evaluate(() => {
    const tasks = (window as unknown as { __longTasks: number[] }).__longTasks;
    return tasks.length === 0 ? 0 : Math.max(...tasks);
  });
}

function scriptRequests(page: Page): string[] {
  const urls: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url()).pathname;
    if (/\.(js|wasm)$/.test(url) || url.startsWith("/pyodide/")) urls.push(url);
  });
  return urls;
}

test("the home screen loads only what it shows, and keeps the heavy code for later", async ({
  page,
}) => {
  const urls = scriptRequests(page);
  const sizes: number[] = [];
  page.on("response", async (response) => {
    if (new URL(response.url()).pathname.endsWith(".js")) {
      sizes.push((await response.body().catch(() => Buffer.alloc(0))).length);
    }
  });
  await seed(page);
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Fight your data clean/ }),
  ).toBeVisible();
  await page.waitForLoadState("networkidle");

  const total = sizes.reduce((sum, n) => sum + n, 0);
  record("home js bytes", total);
  expect(total, "home-screen JavaScript").toBeLessThan(360_000);
  for (const heavy of [
    /BossFightScreen/,
    /sqlite\.worker/,
    /pyodide/,
    /sql-wasm/,
    /csv-import/,
  ]) {
    expect(
      urls.filter((u) => heavy.test(u)),
      `${String(heavy)} on the home page`,
    ).toEqual([]);
  }
});

/** Time from a click to something appearing, measured inside the page so Playwright's own waiting is not counted. */
async function timeFromClickTo(page: Page, appears: string): Promise<void> {
  await page.evaluate((text) => {
    const w = window as unknown as { __clickAt?: number; __seenAt?: number };
    delete w.__clickAt;
    delete w.__seenAt;
    document.addEventListener(
      "click",
      () => {
        w.__clickAt ??= performance.now();
      },
      { capture: true, once: true },
    );
    const look = (): void => {
      const found = [...document.querySelectorAll("*")].some(
        (el) => el.children.length === 0 && el.textContent === text,
      );
      if (found && w.__clickAt !== undefined) {
        w.__seenAt ??= performance.now();
        observer.disconnect();
      }
    };
    const observer = new MutationObserver(look);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
    });
  }, appears);
}

async function readTiming(page: Page): Promise<number> {
  await page.waitForFunction(
    () => (window as unknown as { __seenAt?: number }).__seenAt !== undefined,
  );
  return page.evaluate(() => {
    const w = window as unknown as { __clickAt: number; __seenAt: number };
    return w.__seenAt - w.__clickAt;
  });
}

test("a fight opens fast, and each engine is ready within budget", async ({ page }) => {
  await trackLongTasks(page);
  await seed(page);
  await page.goto("/");
  await page.locator(`[data-world-card="${WORLD}"]`).click();
  const title = titleOf(WORLD, CASE);
  const caseButton = page.getByRole("button", { name: new RegExp(`^${title},`, "i") });
  await expect(caseButton).toBeVisible();
  // Let the roster finish arriving (it fetches what the next click needs), then time the click.
  await page.waitForLoadState("networkidle");

  await timeFromClickTo(page, "SQL");
  await caseButton.click();
  const entry = await readTiming(page);
  record("fight entry ms (click to engine choice)", entry);
  expect(entry, "fight entry").toBeLessThan(3_000);

  const t1 = Date.now();
  await page.getByText("SQL", { exact: true }).click();
  const enter = page.getByText(/ENTER \]/);
  await enter.waitFor({ timeout: 60_000 });
  record("sql ready ms (click to boot ready)", Date.now() - t1);
  expect(Date.now() - t1, "SQL worker ready").toBeLessThan(15_000);
  // The prompt takes input a moment after it appears: retry the press until the editor is up.
  const t2 = Date.now();
  await expect(async () => {
    await enter.click({ timeout: 1_000 });
    await expect(page.locator(".cm-content")).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 30_000 });
  record("codemirror ready ms (press to editor)", Date.now() - t2);
  record("longest long task ms", await longestTask(page));
});

test("Python is ready within budget and starts only when asked for", async ({ page }) => {
  const urls = scriptRequests(page);
  await seed(page);
  await page.goto("/");
  await page.locator(`[data-world-card="${WORLD}"]`).click();
  await page
    .getByRole("button", { name: new RegExp(`^${titleOf(WORLD, CASE)},`, "i") })
    .click();
  const python = page.getByText("PYTHON", { exact: true });
  await expect(python).toBeVisible();
  expect(
    urls.filter((u) => u.includes("pyodide")),
    "Python must not load before the player points at it",
  ).toEqual([]);
  const t0 = Date.now();
  await python.click();
  await page.getByText(/ENTER \]/).waitFor({ timeout: 120_000 });
  record("python ready ms", Date.now() - t0);
  expect(Date.now() - t0, "Python worker ready").toBeLessThan(60_000);
});

test("the biggest allowed CSV imports without freezing the page", async ({ page }) => {
  await trackLongTasks(page);
  await seed(page);
  await page.goto("/");
  await page.getByRole("button", { name: /Sandbox/ }).click();

  // 50,000 rows (the limit), just under 5 MB.
  const lines = ["id,name,city,score,notes"];
  for (let i = 0; i < 50_000; i++) {
    lines.push(
      `${String(i)},Person ${String(i)},City ${String(i % 97)},${String((i * 7) % 100)},"note, number ${String(i)} with some padding text to add weight"`,
    );
  }
  const buffer = Buffer.from(lines.join("\n") + "\n");
  expect(buffer.length).toBeLessThanOrEqual(5_000_000);

  // From disk, not as a buffer: Playwright decodes a buffer inside the page, a main-thread task of its own.
  const path = test.info().outputPath("big.csv");
  writeFileSync(path, buffer);
  const t0 = Date.now();
  await page.setInputFiles('input[type="file"]', path);
  await expect(page.getByRole("button", { name: "Open in the editor" })).toBeVisible({
    timeout: 60_000,
  });
  record("big import ms", Date.now() - t0);
  const worst = await longestTask(page);
  record("big import longest task ms", worst);
  expect(worst, "no single main-thread task during the import").toBeLessThan(150);
});
