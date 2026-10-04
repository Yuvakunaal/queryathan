import { expect, test } from "./fixtures";
import { openCase, run, setCode } from "./helpers";

/**
 * World 6 judges an answer table. These are the realistic wrong answers: each
 * must fail, and must say what is wrong without handing over the answer.
 */
async function noWin(page: import("@playwright/test").Page): Promise<void> {
  await page.waitForTimeout(1500);
  await expect(page.getByRole("dialog")).toHaveCount(0);
}

test("forgetting the status filter gives the right shape but wrong numbers", async ({
  page,
}) => {
  await openCase(page, "the-observatory", "w6-01-first-light", "sql");
  await setCode(
    page,
    "CREATE TABLE result AS SELECT region, SUM(qty * unit_price) AS revenue FROM data GROUP BY region;",
  );
  await run(page);
  const band = page.getByRole("status").filter({ hasText: "rows correct" });
  await expect(band).toContainText("0 / 4");
  await expect(page.getByText("0 of 4 rows right")).toBeVisible();
  await noWin(page);
});

test("a differently named column is reported by name", async ({ page }) => {
  await openCase(page, "the-observatory", "w6-01-first-light", "sql");
  await setCode(
    page,
    "CREATE TABLE result AS SELECT region, SUM(qty * unit_price) AS total FROM data WHERE status = 'completed' GROUP BY region;",
  );
  await run(page);
  await expect(page.getByText("missing column revenue")).toBeVisible();
  await noWin(page);
});

test("the answer lights up one star per right row as it improves", async ({ page }) => {
  await openCase(page, "the-observatory", "w6-01-first-light", "sql");
  await setCode(
    page,
    "CREATE TABLE result AS SELECT region, SUM(qty * unit_price) AS revenue FROM data WHERE status = 'completed' AND region = 'North' GROUP BY region;",
  );
  await run(page);
  const band = page.getByRole("status").filter({ hasText: "rows correct" });
  await expect(band).toContainText("1 / 4");
  await expect(page.getByText("has 1 rows, expected 4")).toBeVisible();
  await noWin(page);
});

test("a rolling average that leaves the first days empty does not win", async ({
  page,
}) => {
  await openCase(page, "the-observatory", "w6-03-sliding-glass", "python");
  await setCode(
    page,
    "df = df.sort_values('day')\ndf['avg_7d'] = df['revenue'].rolling(7).mean()",
  );
  await run(page);
  await expect(page.getByText("54 of 60 rows right")).toBeVisible({ timeout: 30_000 });
  await noWin(page);
});

test("counting visits instead of people does not win", async ({ page }) => {
  await openCase(page, "the-observatory", "w6-04-return-orbit", "sql");
  await setCode(
    page,
    "CREATE TABLE result AS SELECT strftime('%Y-%m', u.signup_date) AS cohort, COUNT(DISTINCT u.user_id) AS users, COUNT(a.user_id) AS retained, ROUND(100.0 * COUNT(a.user_id) / COUNT(DISTINCT u.user_id), 1) AS retention_pct FROM data u LEFT JOIN activity a ON a.user_id = u.user_id AND strftime('%Y-%m', a.active_date) = strftime('%Y-%m', date(u.signup_date, 'start of month', '+1 month')) GROUP BY cohort;",
  );
  await run(page);
  await expect(
    page.getByRole("status").filter({ hasText: "rows correct" }),
  ).not.toContainText("6 / 6", { timeout: 30_000 });
  await noWin(page);
});

test("a final-boss funnel that ignores the order of events does not win", async ({
  page,
}) => {
  await openCase(page, "the-observatory", "w6-06-the-observatory", "sql");
  await setCode(
    page,
    "CREATE TABLE result AS SELECT device, COUNT(DISTINCT CASE WHEN step='view' THEN user_id END) AS viewed, COUNT(DISTINCT CASE WHEN step='cart' THEN user_id END) AS carted, COUNT(DISTINCT CASE WHEN step='purchase' THEN user_id END) AS purchased FROM data GROUP BY device;",
  );
  await run(page);
  await expect(
    page.getByRole("status").filter({ hasText: "rows correct" }),
  ).toContainText("/ 3", { timeout: 30_000 });
  await noWin(page);
});
