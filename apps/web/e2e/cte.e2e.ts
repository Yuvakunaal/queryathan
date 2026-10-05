import { expect, test } from "./fixtures";
import { openCase, run, setCode } from "./helpers";

const CASE = ["the-observatory", "w6-01-first-light"] as const;

// The same answer as the model solution, but written the way people write real SQL: in steps.
const CTE_ANSWER = `WITH done AS (
  SELECT region, qty * unit_price AS line FROM data WHERE status = 'completed'
)
SELECT region, SUM(line) AS revenue FROM done GROUP BY region`;

test("CREATE TABLE result AS WITH ... works and wins", async ({ page }) => {
  await openCase(page, ...CASE, "sql");
  await setCode(page, `CREATE TABLE result AS\n${CTE_ANSWER};`);
  await run(page);
  await expect(page.getByRole("dialog")).toBeVisible({ timeout: 40_000 });
});

test("a WITH ... SELECT that only shows rows can be handed in with one click", async ({
  page,
}) => {
  await openCase(page, ...CASE, "sql");
  await setCode(page, `${CTE_ANSWER};`);
  await run(page);
  const offer = page.getByRole("button", { name: "Use this query as the answer" });
  await expect(offer).toBeVisible({ timeout: 30_000 });
  await expect(page.locator("#pane-result")).toContainText("This query only shows rows");
  await offer.click();
  // The query is wrapped, run again, and judged.
  await expect(page.locator(".cm-content")).toContainText("CREATE TABLE result AS");
  await expect(page.locator(".cm-content")).toContainText("WITH done AS");
  await expect(page.getByRole("dialog")).toBeVisible({ timeout: 40_000 });
});

test("the offer is not there for a cleaning case, where the query is not the answer", async ({
  page,
}) => {
  await openCase(page, "boss-fights", "w1-01-nul-sentinel", "sql");
  await setCode(
    page,
    "WITH n AS (SELECT * FROM data WHERE temp_c IS NULL) SELECT COUNT(*) FROM n;",
  );
  await run(page);
  await expect(page.locator("#pane-result")).toContainText("1 row");
  await expect(
    page.getByRole("button", { name: "Use this query as the answer" }),
  ).toHaveCount(0);
});

test("a missing frame number is explained in plain words", async ({ page }) => {
  await openCase(page, "the-observatory", "w6-03-sliding-glass", "sql");
  await setCode(
    page,
    "with cte as (\n  SELECT day, revenue, AVG(revenue) OVER (ORDER BY day ROWS BETWEEN PRECEDING AND CURRENT ROW) AS avg_7d FROM data\n)\nselect * from cte;",
  );
  await run(page);
  await expect(page.locator("#pane-result")).toContainText(
    "needs a number before PRECEDING",
    { timeout: 30_000 },
  );
});

test("a CTE name used in a later statement says why it is gone", async ({ page }) => {
  await openCase(page, ...CASE, "sql");
  await setCode(page, "WITH c AS (SELECT 1 AS a) SELECT * FROM c;\nSELECT * FROM c;");
  await run(page);
  await expect(page.locator("#pane-result")).toContainText("gone after the semicolon", {
    timeout: 30_000,
  });
});
