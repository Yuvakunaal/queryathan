import { test, expect } from "./fixtures";
import { openCase, run, setCode, titleOf } from "./helpers";
import type { EngineName } from "./helpers";
import { SOLUTIONS } from "./solutions";

/**
 * A wrong or unchanged answer must never win. The starter code only looks at
 * the data (or, in World 5, is correct but too slow), so running it as-is must
 * leave the case unsolved.
 */
for (const solution of SOLUTIONS) {
  const engines: EngineName[] =
    solution.world === "the-foundry" ? ["python", "sql"] : ["sql"];
  for (const engine of engines) {
    test(`${titleOf(solution.world, solution.caseId)}: running the starter does not win (${engine})`, async ({
      page,
    }) => {
      await openCase(page, solution.world, solution.caseId, engine);
      await run(page);
      await expect(page.getByRole("button", { name: /^Run$/ })).toBeEnabled({
        timeout: 60_000,
      });
      await page.waitForTimeout(1500);
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(page.getByRole("status").filter({ hasText: "defeated" })).toHaveCount(
        0,
      );
    });
  }
}

test("a near miss does not win: a plain join in DOUBLE_VISION multiplies the rows", async ({
  page,
}) => {
  await openCase(page, "the-twins", "w3-03-double-vision", "python");
  await setCode(page, "df = df.merge(customers, on='customer_id', how='left')");
  await run(page);
  await expect(page.getByText(/has \d{3}/).first()).toBeVisible();
  await page.waitForTimeout(1500);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("a near miss does not win: keeping the old columns in MELT_FORM", async ({
  page,
}) => {
  await openCase(page, "the-architect", "w4-01-melt-form", "sql");
  await setCode(
    page,
    "CREATE TABLE result AS SELECT product, 'jan' AS month, jan AS sales, jan, feb, mar FROM data;",
  );
  await run(page);
  await page.waitForTimeout(1500);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
