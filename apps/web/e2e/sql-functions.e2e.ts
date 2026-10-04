import { expect, test } from "./fixtures";
import { openCase, run, setCode } from "./helpers";

const NUL = "w1-01-nul-sentinel";

test("the everyday date, text and null functions work in the real engine", async ({
  page,
}) => {
  await openCase(page, "boss-fights", NUL, "sql");
  await setCode(
    page,
    `SELECT YEAR(captured_at) AS y, MONTH(captured_at) AS m, DATE_TRUNC('month', captured_at) AS first_day,
  EXTRACT(DAY FROM captured_at) AS d, DATEDIFF(day, '2026-01-01', captured_at) AS since_new_year,
  COALESCE(temp_c, -1) AS t, INITCAP(LOWER(station)) AS st, LEFT(station, 2) AS ab
FROM data LIMIT 5;`,
  );
  await run(page);
  const result = page.locator("#pane-result");
  await expect(result).toContainText("5 rows", { timeout: 20_000 });
  await expect(result).toContainText("first_day");
  await expect(result).not.toContainText("no such function");
  await expect(result).not.toContainText("syntax error");
});

test("a function the editor does not know gets a clear explanation", async ({ page }) => {
  await openCase(page, "boss-fights", NUL, "sql");
  await setCode(page, "SELECT FANCY_FUNCTION(temp_c) FROM data;");
  await run(page);
  await expect(page.locator("#pane-result")).toContainText("no such function");
});

test("SQL help lists the functions by topic, searches, and inserts into the query", async ({
  page,
}) => {
  await openCase(page, "boss-fights", NUL, "sql");
  await setCode(page, "SELECT ");
  await page.getByRole("button", { name: "SQL help" }).click();
  const help = page.getByRole("region", { name: "SQL help" });
  await expect(help.getByRole("button", { name: "Dates and time" })).toBeVisible();
  await expect(help).toContainText("DATE_TRUNC('month', date)");
  await help.getByRole("searchbox", { name: "Search SQL help" }).fill("coalesce");
  await expect(help).toContainText("The first value that is not empty");
  await help.getByRole("button", { name: /COALESCE\(a, b/ }).click();
  await expect(help).toBeHidden();
  await expect(page.locator(".cm-content")).toContainText("SELECT COALESCE(");
});

test("typing a function name offers it with how it is written", async ({ page }) => {
  await openCase(page, "boss-fights", NUL, "sql");
  await setCode(page, "SELECT DATE_TR");
  await page.keyboard.press("Control+Space");
  const tip = page.locator(".cm-tooltip-autocomplete");
  await expect(tip).toContainText("DATE_TRUNC");
});
