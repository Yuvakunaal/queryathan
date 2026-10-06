import { writeFileSync } from "node:fs";
import type { Page } from "@playwright/test";
import { test, expect } from "./fixtures";
import { seed, titleOf } from "./helpers";

const WORLD = "boss-fights";
const CASE = "w1-01-nul-sentinel";

/** Records every script, stylesheet and worker file the page asks for. */
function trackRequests(page: Page): string[] {
  const urls: string[] = [];
  page.on("request", (request) => {
    urls.push(new URL(request.url()).pathname);
  });
  return urls;
}

const asked = (urls: string[], pattern: RegExp): boolean =>
  urls.some((u) => pattern.test(u));

async function openRoster(page: Page): Promise<void> {
  await seed(page);
  await page.goto("/");
  await page.locator(`[data-world-card="${WORLD}"]`).click();
  await expect(
    page.getByRole("button", { name: new RegExp(`^${titleOf(WORLD, CASE)},`, "i") }),
  ).toBeVisible();
}

async function openFight(page: Page): Promise<void> {
  await openRoster(page);
  await page
    .getByRole("button", { name: new RegExp(`^${titleOf(WORLD, CASE)},`, "i") })
    .click();
  await expect(page.getByText("SQL", { exact: true })).toBeVisible();
}

test.describe("code arrives when it is needed", () => {
  test("the home page asks for no fight, editor, tips or engine code", async ({
    page,
  }) => {
    const urls = trackRequests(page);
    await seed(page);
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /Fight your data clean/ }),
    ).toBeVisible();
    await page.waitForLoadState("networkidle");
    for (const heavy of [
      /BossFightScreen/,
      /CodeEditor/,
      /TipsDialog/,
      /sqlite\.worker/,
      /pyodide/,
      /csv-import/,
      /sql-wasm/,
    ]) {
      expect(asked(urls, heavy), `${String(heavy)} on the home page`).toBe(false);
    }
  });

  test("the world map fetches the fight, the editor and the tips for the next click", async ({
    page,
  }) => {
    const urls = trackRequests(page);
    await openRoster(page);
    await expect.poll(() => asked(urls, /BossFightScreen/)).toBe(true);
    await expect.poll(() => asked(urls, /CodeEditor/)).toBe(true);
    await expect.poll(() => asked(urls, /TipsDialog/)).toBe(true);
    // Still no engine: that waits for the player to choose one.
    expect(asked(urls, /sqlite\.worker|pyodide/)).toBe(false);
  });

  test("the editor is already there while the engine is being chosen, and no engine has started", async ({
    page,
  }) => {
    const urls = trackRequests(page);
    await openFight(page);
    await expect.poll(() => asked(urls, /CodeEditor/)).toBe(true);
    expect(asked(urls, /sqlite\.worker|pyodide/)).toBe(false);
  });

  test("pointing at Python starts it, and choosing SQL never loads Python", async ({
    page,
  }) => {
    const urls = trackRequests(page);
    await openFight(page);
    await page.getByText("PYTHON", { exact: true }).hover();
    await expect.poll(() => asked(urls, /pyodide/)).toBe(true);
    await page.getByText("SQL", { exact: true }).click();
    await page.getByText(/ENTER \]/).waitFor({ timeout: 60_000 });
    expect(asked(urls, /sqlite\.worker/)).toBe(true);
  });

  test("the Tips dialog opens, with its reference, after being loaded on demand", async ({
    page,
  }) => {
    await openFight(page);
    await page
      .getByRole("button", { name: /tips|reference|book/i })
      .first()
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});

test.describe("the CSV import worker", () => {
  async function openSandbox(page: Page): Promise<void> {
    await seed(page);
    await page.goto("/");
    await page.getByRole("button", { name: /Sandbox/ }).click();
  }

  test("a file is read in a worker that starts only when a file arrives", async ({
    page,
  }) => {
    const workers: string[] = [];
    page.on("worker", (worker) => workers.push(worker.url()));
    await openSandbox(page);
    expect(workers.some((u) => u.includes("csv-import"))).toBe(false);

    await page.setInputFiles('input[type="file"]', {
      name: "a.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("Name,Attendance%\nKunaal,70\nVakul,65\n"),
    });
    await expect(page.getByRole("button", { name: "Open in the editor" })).toBeVisible();
    expect(workers.some((u) => u.includes("csv-import"))).toBe(true);
  });

  test("a file far over the limit is refused from its size, without reading it or starting the worker", async ({
    page,
  }) => {
    const workers: string[] = [];
    page.on("worker", (worker) => workers.push(worker.url()));
    await openSandbox(page);
    const path = test.info().outputPath("huge.csv");
    writeFileSync(path, "a,b\n" + "1,2\n".repeat(3_000_000)); // about 12 MB
    await page.setInputFiles('input[type="file"]', path);
    await expect(
      page.getByText(/That file is 12\.\d MB\. The sandbox handles files up to 5 MB\.$/),
    ).toBeVisible();
    expect(workers.some((u) => u.includes("csv-import"))).toBe(false);
  });

  test("a file between the limit and twice the limit gets the exact-size message", async ({
    page,
  }) => {
    await openSandbox(page);
    const path = test.info().outputPath("large.csv");
    writeFileSync(path, "a,b\n" + "1,2\n".repeat(2_000_000)); // about 8 MB
    await page.setInputFiles('input[type="file"]', path);
    await expect(
      page.getByText(
        /That file is 8\.\d MB\. The sandbox handles files up to 5 MB so it stays fast in your browser/,
      ),
    ).toBeVisible();
  });

  test("an extra join table over twice the limit is refused by its size too", async ({
    page,
  }) => {
    await openSandbox(page);
    await page.setInputFiles('input[type="file"]', {
      name: "main.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("id,city\n1,Austin\n"),
    });
    await expect(page.getByRole("button", { name: "Open in the editor" })).toBeVisible();
    const path = test.info().outputPath("extra.csv");
    writeFileSync(path, "id,x\n" + "1,2\n".repeat(3_000_000));
    await page.setInputFiles('input[aria-label="Choose another CSV file to join"]', path);
    await expect(
      page.getByText(
        /extra\.csv: That file is 1\d\.\d MB\. The sandbox handles files up to 5 MB\.$/,
      ),
    ).toBeVisible();
  });

  test("a joined table keeps its columns and tooltips without being parsed again at the fight", async ({
    page,
  }) => {
    await openSandbox(page);
    await page.setInputFiles('input[type="file"]', {
      name: "people.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("id,city\n1,Austin\n2,Denver\n"),
    });
    await page.setInputFiles('input[aria-label="Choose another CSV file to join"]', {
      name: "scores.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("id,score\n1,10\n2,12\n"),
    });
    await page.getByRole("button", { name: "Open in the editor" }).click();
    await page.getByText("SQL", { exact: true }).click();
    await page.locator(".cm-content").waitFor({ timeout: 60_000 });
    // The editor lists the joined table and its columns, in the order they were added.
    const chips = page.locator("button", { hasText: /^(data|scores|id|city|score)$/ });
    await expect(chips.first()).toBeVisible();
    await expect(page.getByRole("button", { name: "scores", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "score", exact: true })).toBeVisible();
  });
});

test.describe("Python start-up", () => {
  // The service worker would answer the runtime's requests itself, past the test's routes.
  test.use({ serviceWorkers: "block" });

  test("a failed start can be retried in the app, and then works", async ({ page }) => {
    // The runtime's own failed download is reported by the browser as an uncaught fetch failure.
    test
      .info()
      .annotations.push({ type: "allow-pageerror", description: "Failed to fetch" });
    let blocked = true;
    await page.route("**/assets/pyodide.worker-*.js", async (route) => {
      if (blocked) await route.fulfill({ status: 500, body: "unavailable" });
      else await route.continue();
    });
    await openFight(page);
    await page.getByText("PYTHON", { exact: true }).click();
    const alert = page.getByRole("alert");
    // The worker's script could not be loaded: reported at once, not after the start-up time limit.
    await expect(alert).toContainText("engine failed to start", { timeout: 10_000 });

    blocked = false;
    await alert.getByRole("button", { name: "Try again" }).click();
    await expect(page.getByText(/ENTER \]/)).toBeVisible({ timeout: 120_000 });
    await expect(page.getByRole("alert")).toHaveCount(0);
  });

  test("a slow first start says which step it is on", async ({ page }) => {
    await page.route("**/pyodide/pyodide.asm.wasm", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 6_000));
      await route.continue();
    });
    await openFight(page);
    await page.getByText("PYTHON", { exact: true }).click();
    await expect(page.getByText(/Now: starting the Python runtime\./)).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(/ENTER \]/)).toBeVisible({ timeout: 120_000 });
  });
});
