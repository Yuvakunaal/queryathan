import { expect, test } from "./fixtures";
import { openCase, run, setCode } from "./helpers";
import type { EngineName } from "./helpers";
import { SOLUTIONS } from "./solutions";

/**
 * Running the same code twice must give the same answer. These solutions all
 * break if the second run starts from the first run's result (a table cannot be
 * melted, joined or extended twice), so they prove every run starts fresh.
 */
const CASES: [string, string, EngineName][] = [
  ["the-architect", "w4-01-melt-form", "python"],
  ["the-twins", "w3-01-key-mirror", "python"],
  ["the-foundry", "w5-01-slow-lane", "sql"],
  ["the-observatory", "w6-03-sliding-glass", "python"],
  ["the-architect", "w4-02-pivot-plan", "sql"],
];

for (const [world, caseId, engine] of CASES) {
  test(`${caseId} (${engine}): running the solution twice gives the same win`, async ({
    page,
  }) => {
    test.setTimeout(150_000);
    const solution = SOLUTIONS.find((s) => s.caseId === caseId);
    if (!solution) throw new Error(`no solution for ${caseId}`);
    await openCase(page, world, caseId, engine);
    await setCode(page, solution[engine]);
    await run(page);
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 40_000 });
    await dialog.getByRole("button", { name: "Keep exploring" }).click();
    await run(page);
    await expect(page.getByRole("button", { name: /^Run$/ })).toBeEnabled({
      timeout: 60_000,
    });
    await expect(page.getByText("Your code hit an error")).toHaveCount(0);
    await page.waitForTimeout(500);
    await expect(page.getByRole("button", { name: /^Run$/ })).toBeEnabled();
  });
}

test("a selection runs on the table as it is now, the whole editor on the original", async ({
  page,
}) => {
  await openCase(page, "boss-fights", "w1-01-nul-sentinel", "sql");
  const count = "SELECT COUNT(*) AS marked FROM data WHERE station = 'X';";
  await setCode(page, "UPDATE data SET station = 'X';");
  await run(page);
  await expect(page.getByRole("button", { name: /^Run$/ })).toBeEnabled();
  // Select the whole line, so only the selection runs, on the table as the update left it.
  await setCode(page, count);
  await page.keyboard.press("ControlOrMeta+a");
  await page.getByRole("button", { name: "Run selection" }).click();
  await expect(page.locator("#pane-result")).toContainText("240", { timeout: 20_000 });
  // With nothing selected the whole editor runs on the original table: nothing is marked.
  await page.locator(".cm-content").click();
  await page.keyboard.press("ControlOrMeta+End");
  await run(page);
  await expect(page.locator("#pane-result")).not.toContainText("240", {
    timeout: 20_000,
  });
  await expect(page.locator("#pane-result")).toContainText("marked");
});
