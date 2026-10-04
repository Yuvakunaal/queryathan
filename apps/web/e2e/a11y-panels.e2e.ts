import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { test, expect } from "./fixtures";
import { openCase, rosterOf, seed } from "./helpers";
import type { Theme } from "./helpers";

// The newer panels: the sound menu, SQL help, and the table collage, in both themes.
test.use({ reducedMotion: "reduce" });

async function scan(page: Page, label: string): Promise<void> {
  await page.waitForTimeout(400);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const summary = results.violations.map((v) => ({
    rule: v.id,
    nodes: v.nodes
      .slice(0, 3)
      .map((n) => `${n.target.join(" ")} :: ${n.failureSummary?.split("\n")[1] ?? ""}`),
  }));
  expect(summary, `accessibility violations on ${label}`).toEqual([]);
}

for (const theme of ["dark", "light"] as Theme[]) {
  test(`sound menu, SQL help and the collage pass (${theme})`, async ({ page }) => {
    test.setTimeout(150_000);
    // Seeded first with the theme (seeding never overwrites), then the fight is opened as usual.
    await seed(page, {
      theme,
      cleared: { "the-twins": rosterOf("the-twins").slice(0, 5) },
    });
    await openCase(page, "the-twins", "w3-06-four-corners", "sql");
    await scan(page, `four table collage, ${theme}`);
    await page.getByRole("button", { name: "SQL help" }).click();
    await scan(page, `SQL help, ${theme}`);
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Sound settings" }).click();
    await scan(page, `sound menu in a fight, ${theme}`);
  });
}
