import { expect, test } from "./fixtures";
import { openCase, run, setCode } from "./helpers";
import { SOLUTIONS } from "./solutions";

test.describe("a table wider than its panel", () => {
  test.use({ viewport: { width: 1100, height: 760 }, reducedMotion: "reduce" });

  test("the header and the row stripes run to the very end when scrolled sideways", async ({
    page,
  }) => {
    test.setTimeout(150_000);
    await openCase(page, "the-twins", "w3-02-ghost-twin", "sql", { skipBoot: true });
    await page.getByText(/ENTER \]/).waitFor({ timeout: 120_000 });
    await page.waitForTimeout(700);
    await page.keyboard.press("Enter");
    await page.locator(".cm-content").waitFor();
    const solution = SOLUTIONS.find((s) => s.caseId === "w3-02-ghost-twin");
    if (!solution) throw new Error("no solution");
    await setCode(page, solution.sql);
    await run(page);
    await page.getByRole("button", { name: "Keep exploring" }).click({ timeout: 40_000 });
    await page.getByRole("tab", { name: "Your answer (result)" }).click();
    await page.waitForTimeout(400);

    const measure = await page.evaluate(() => {
      const scroller = document.querySelector<HTMLElement>('#pane-answer [role="grid"]');
      if (!scroller) return null;
      scroller.scrollLeft = scroller.scrollWidth;
      const rect = (el: Element | null): number => el?.getBoundingClientRect().right ?? 0;
      const header = scroller.querySelector('[role="row"]');
      const rows = scroller.querySelectorAll('[role="rowgroup"] [role="row"]');
      const lastHeader = scroller.querySelector('[role="columnheader"]:last-of-type');
      const lastRow = rows[rows.length - 1] ?? null;
      return {
        overflow: scroller.scrollWidth - scroller.clientWidth,
        edge: scroller.getBoundingClientRect().right,
        header: rect(header),
        row: rect(lastRow),
        lastHeader: rect(lastHeader),
        rowCount: rows.length,
      };
    });
    if (!measure) throw new Error("no grid");
    // The table really is wider than the panel, so this checks the interesting case.
    expect(measure.overflow).toBeGreaterThan(20);
    // At the far right, the header and the rows reach the panel's edge (no bare strip).
    expect(measure.header).toBeGreaterThanOrEqual(measure.edge - 2);
    expect(measure.row).toBeGreaterThanOrEqual(measure.edge - 2);
    // And the last column ends where the header ends.
    expect(Math.abs(measure.lastHeader - measure.header)).toBeLessThanOrEqual(2);
  });
});
