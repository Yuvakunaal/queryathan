import { test, expect } from "./fixtures";
import { openCase, run, seed, setCode } from "./helpers";

const NUL = "w1-01-nul-sentinel";

test.describe("the editor runs like a worksheet", () => {
  test("with text selected only that runs; with nothing selected everything runs", async ({
    page,
  }) => {
    await openCase(page, "boss-fights", NUL, "sql");
    await setCode(page, "UPDATE data SET temp_c = 0;\nSELECT COUNT(*) AS n FROM data;");
    await page.keyboard.press("ControlOrMeta+End");
    await page.keyboard.down("Shift");
    await page.keyboard.press("Home");
    await page.keyboard.up("Shift");
    await expect(page.getByRole("button", { name: "Run selection" })).toBeVisible();
    await page.getByRole("button", { name: "Run selection" }).click();
    await expect(page.locator("#pane-result")).toContainText("240");
    // the UPDATE did not run, so the nulls are still there
    await expect(page.getByText("No gaps in temp_c (23 empty)")).toBeVisible();
    await page.locator(".cm-line").first().click();
    await page.keyboard.press("End");
    await run(page);
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 40_000 });
  });

  test("Format tidies SQL", async ({ page }) => {
    await openCase(page, "boss-fights", NUL, "sql");
    await setCode(page, "select a,b from data where a>1 and b<2");
    await page.getByRole("button", { name: "Format" }).click();
    await expect(page.locator(".cm-content")).toContainText("SELECT");
    await expect(page.locator(".cm-content")).toContainText("WHERE");
    expect(await page.locator(".cm-line").count()).toBeGreaterThan(3);
  });

  test("clicking a column chip inserts its name, and Reset restores the starter", async ({
    page,
  }) => {
    await openCase(page, "boss-fights", NUL, "sql");
    const starter = (await page.locator(".cm-content").innerText()).replace(/\s+/g, "");
    await setCode(page, "SELECT ");
    await page.getByRole("button", { name: "temp_c", exact: true }).click();
    await expect(page.locator(".cm-content")).toContainText("SELECT temp_c");
    await page.getByRole("button", { name: "Reset", exact: true }).click();
    await expect
      .poll(async () =>
        (await page.locator(".cm-content").textContent())?.replace(/\s+/g, ""),
      )
      .toBe(starter);
  });

  test("Python autocompletes column names", async ({ page }) => {
    await openCase(page, "boss-fights", NUL, "python");
    await setCode(page, "df['tem");
    await page.keyboard.press("Control+Space");
    await expect(page.locator(".cm-tooltip-autocomplete")).toContainText("temp_c");
  });
});

test.describe("results and errors appear on the right", () => {
  test("a query's rows show as a table, with a way back to the data", async ({
    page,
  }) => {
    await openCase(page, "boss-fights", NUL, "sql");
    await setCode(page, "SELECT station, COUNT(*) AS n FROM data GROUP BY station;");
    await run(page);
    const result = page.locator("#pane-result");
    await expect(result).toContainText("6 rows");
    await expect(result).toContainText("ST-19");
    await result.getByRole("button", { name: "Back to your data" }).click();
    await expect(page.getByRole("tab", { name: "Your data" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("an SQL error replaces the table with a plain explanation", async ({ page }) => {
    await openCase(page, "boss-fights", NUL, "sql");
    await setCode(page, "SELEC 1;");
    await run(page);
    const result = page.locator("#pane-result");
    await expect(
      result.getByRole("heading", { name: "Your code hit an error" }),
    ).toBeVisible();
    await expect(result).toContainText('near "SELEC": syntax error');
    await expect(result).toContainText("could not read the statement");
  });

  test("a Python error leads with the error line, not the traceback", async ({
    page,
  }) => {
    await openCase(page, "boss-fights", NUL, "python");
    await setCode(page, "df['nope']");
    await run(page);
    const result = page.locator("#pane-result");
    await expect(result).toContainText("KeyError: 'nope'");
    await expect(result).toContainText("misspelled");
  });

  test("a DataFrame result never exposes internal columns", async ({ page }) => {
    await openCase(page, "boss-fights", NUL, "python");
    await setCode(page, "print(list(df.columns), df.shape)\ndf.isna().sum()");
    await run(page);
    const text = await page.locator("#pane-result").innerText();
    expect(text).not.toMatch(/__dcq/);
    await page.getByRole("tab", { name: "Changes" }).click();
  });
});

test.describe("the data table", () => {
  test("keeps its scroll position and rows after visiting another tab", async ({
    page,
  }) => {
    await openCase(page, "boss-fights", NUL, "sql");
    const grid = page.locator('#pane-data [role="grid"]');
    await grid.evaluate((el) => {
      el.scrollTop = 2600;
    });
    await page.waitForTimeout(300);
    await setCode(page, "SELECT 1;");
    await run(page);
    await page.getByRole("tab", { name: "Changes" }).click();
    await page.getByRole("tab", { name: "Your data" }).click();
    const state = await grid.evaluate((el) => {
      const header = el.querySelector('[role="row"]')?.getBoundingClientRect();
      const rows = [...el.querySelectorAll('[role="row"]')].slice(1);
      const first = rows
        .map((row) => row.getBoundingClientRect().top)
        .filter((top) => header && top >= header.bottom - 1)
        .sort((a, b) => a - b)[0];
      return {
        scrollTop: el.scrollTop,
        gap: header && first !== undefined ? first - header.bottom : null,
      };
    });
    expect(state.scrollTop).toBe(2600);
    expect(state.gap).not.toBeNull();
    expect(state.gap ?? 999).toBeLessThan(40);
  });

  test("scrolls sideways inside its panel when the panel is made narrow", async ({
    page,
  }) => {
    await openCase(page, "boss-fights", NUL, "sql");
    const handle = page.getByRole("separator", { name: /left panel/ });
    await handle.focus();
    await page.keyboard.press("End");
    const sizes = await page.evaluate(() => {
      const grid = document.querySelector('#pane-data [role="grid"]');
      return {
        client: grid?.clientWidth ?? 0,
        scroll: grid?.scrollWidth ?? 0,
        page: document.documentElement.scrollWidth - window.innerWidth,
      };
    });
    expect(sizes.scroll).toBeGreaterThan(sizes.client);
    expect(sizes.page).toBeLessThanOrEqual(0);
  });
});

test.describe("resizable panels", () => {
  test("the divider moves with arrow keys, resets with Enter and is remembered", async ({
    page,
  }) => {
    await openCase(page, "boss-fights", NUL, "sql");
    const rail = page.locator('[class*="commandRail"]').first();
    const width = async (): Promise<number> =>
      Math.round((await rail.boundingBox())?.width ?? 0);
    const start = await width();
    const handle = page.getByRole("separator", { name: /left panel/ });
    await handle.focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    expect(await width()).toBeGreaterThan(start + 40);
    await page.reload();
    await page.locator('[data-world-card="boss-fights"]').click();
    await page.getByRole("button", { name: /^NUL_SENTINEL,/ }).click();
    await page.getByText("SQL", { exact: true }).click();
    await page.getByText(/ENTER \]/).waitFor();
    await page.waitForTimeout(700);
    await page.getByText(/ENTER \]/).click();
    await page.locator(".cm-content").waitFor();
    expect(await width()).toBeGreaterThan(start + 40);
    await page.getByRole("separator", { name: /left panel/ }).focus();
    await page.keyboard.press("Enter");
    expect(Math.abs((await width()) - start)).toBeLessThan(3);
  });
});

test.describe("the win sequence", () => {
  test("can be skipped, and the summary shows the run", async ({ page }) => {
    await openCase(page, "boss-fights", NUL, "python");
    await setCode(page, "df['temp_c'] = df['temp_c'].fillna(df['temp_c'].mean())");
    await run(page);
    const overlay = page.getByRole("status").filter({ hasText: "defeated" });
    await expect(overlay).toBeVisible({ timeout: 10_000 });
    await page.keyboard.press("Escape");
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await expect(dialog).toContainText("NUL_SENTINEL");
    await expect(dialog).toContainText("Cells cleaned");
    await dialog.getByRole("button", { name: "Back to roster" }).click();
    await expect(page.getByRole("heading", { name: "Boss Fights" })).toBeVisible();
    await expect(page.getByText("Cleared").first()).toBeVisible();
  });

  test("the winner can copy their own solution", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await openCase(page, "boss-fights", NUL, "python");
    const code = "df['temp_c'] = df['temp_c'].fillna(df['temp_c'].mean())";
    await setCode(page, code);
    await run(page);
    await page.keyboard.press("Escape");
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 15_000 });
    await dialog.getByRole("button", { name: "Copy my solution" }).click();
    await expect(dialog).toContainText("Copied your solution");
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toContain(code);
    expect(copied.startsWith("# Data Cleaning Quest:")).toBe(true);
  });

  test("a speed job earns a stamp that the roster keeps", async ({ page }) => {
    await openCase(page, "the-foundry", "w5-01-slow-lane", "python");
    await setCode(
      page,
      "df['total'] = df['qty'] * df['unit_price'] * (1 - df['discount'])",
    );
    await run(page);
    await page.keyboard.press("Escape");
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText(/(BRONZE|SILVER|GOLD) STAMP/i, {
      timeout: 15_000,
    });
    await dialog.getByRole("button", { name: "Back to roster" }).click();
    await expect(page.locator("[data-stamp]").first()).toBeVisible();
  });
});

test("a run that goes on for more than 20 seconds restarts the engine and the next run works", async ({
  page,
}) => {
  test.setTimeout(150_000);
  await openCase(page, "boss-fights", NUL, "sql");
  await setCode(
    page,
    "WITH RECURSIVE c(x) AS (SELECT 1 UNION ALL SELECT x+1 FROM c WHERE x < 4000000000) SELECT COUNT(*) FROM c;",
  );
  await run(page);
  const result = page.locator("#pane-result");
  await expect(result).toContainText("ran for more than 20 seconds", { timeout: 60_000 });
  await expect(page.getByRole("button", { name: /^Run$/ })).toBeEnabled({
    timeout: 60_000,
  });
  await setCode(page, "SELECT COUNT(*) AS n FROM data;");
  await run(page);
  await expect(result).toContainText("240");
});

// Dark text on a light scene for the dark theme, light text on a dark scene for the light theme.
for (const [theme, ink] of [
  ["dark", "#10161b"],
  ["light", "#e8eef2"],
] as const) {
  test(`the finishing cut is the opposite of the theme (${theme} theme)`, async ({
    page,
  }) => {
    await seed(page, { theme });
    await openCase(page, "boss-fights", NUL, "sql");
    await setCode(
      page,
      "UPDATE data SET temp_c = (SELECT AVG(temp_c) FROM data) WHERE temp_c IS NULL;",
    );
    await run(page);
    // The scene is the one status region that defines its own ink colour.
    const handle = await page.waitForFunction(
      () =>
        [...document.querySelectorAll('[role="status"]')]
          .map((el) => getComputedStyle(el).getPropertyValue("--k-ink").trim())
          .find((v) => v !== ""),
      undefined,
      { timeout: 20_000 },
    );
    const value = await handle.jsonValue();
    expect(value).toBe(ink);
  });
}
