import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { test, expect } from "./fixtures";
import { openCase, run, seed, setCode } from "./helpers";
import type { Theme } from "./helpers";

/**
 * Automated WCAG 2.x A and AA checks (axe-core) on every kind of screen, in
 * both themes and with high contrast on. Automated checks catch roughly a
 * third of real problems (contrast, names, roles, landmarks, focus order is
 * not among them), so this is a floor, not a full audit.
 */
// Scanning mid-animation measures half-faded text, so the scans run without motion.
test.use({ reducedMotion: "reduce" });

async function expectNoViolations(page: Page, label: string): Promise<void> {
  // A scan taken in the frame where a tab becomes visible sees its cells as hidden.
  await page.waitForTimeout(400);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const summary = results.violations.map((violation) => ({
    rule: violation.id,
    impact: violation.impact,
    help: violation.help,
    nodes: violation.nodes
      .slice(0, 4)
      .map(
        (node) =>
          `${node.target.join(" ")} :: ${node.failureSummary?.split("\n")[1] ?? ""}`,
      ),
  }));
  expect(summary, `accessibility violations on ${label}`).toEqual([]);
}

for (const theme of ["dark", "light"] as Theme[]) {
  test.describe(`${theme} theme`, () => {
    test("home screen and the About dialog", async ({ page }) => {
      await seed(page, { theme });
      await page.goto("/");
      await expectNoViolations(page, "home");
      await page
        .getByRole("button", { name: /What is this\?/ })
        .nth(1)
        .click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await expectNoViolations(page, "about dialog");
    });

    test("a world roster", async ({ page }) => {
      await seed(page, { theme, cleared: { "the-vault": ["w2-01-pin-tumbler"] } });
      await page.goto("/");
      await page.locator('[data-world-card="the-vault"]').click();
      await expect(page.getByRole("heading", { name: "Cryptara" })).toBeVisible();
      await expectNoViolations(page, "roster");
    });

    test("the engine choice and the sandbox setup", async ({ page }) => {
      await seed(page, { theme });
      await page.goto("/");
      await page.getByRole("button", { name: /Sandbox/ }).click();
      await expect(
        page.getByRole("heading", { name: "Bring your own data." }),
      ).toBeVisible();
      await expectNoViolations(page, "sandbox setup");
    });

    test("a fight: data, a result, an error, and the victory panel", async ({ page }) => {
      await seed(page, { theme });
      await page.goto("/");
      await page.locator('[data-world-card="boss-fights"]').click();
      await page.getByRole("button", { name: /^NUL_SENTINEL,/ }).click();
      await expect(page.getByText("select an engine to face")).toBeVisible();
      await page.waitForTimeout(1200); // let the entrance animation finish
      await expectNoViolations(page, "engine choice");
      await page.getByText("SQL", { exact: true }).click();
      await page.getByText(/ENTER \]/).waitFor({ timeout: 120_000 });
      await page.waitForTimeout(700);
      await page.getByText(/ENTER \]/).click();
      await page.locator(".cm-content").waitFor();
      await page.waitForTimeout(1200); // let the entrance animation finish
      await expectNoViolations(page, "fight, data tab");
      await setCode(page, "SELECT station, COUNT(*) AS n FROM data GROUP BY station;");
      await run(page);
      await expect(page.locator("#pane-result")).toContainText("6 rows");
      await expectNoViolations(page, "fight, result tab");
      await setCode(page, "SELEC 1;");
      await run(page);
      await expect(page.locator("#pane-result")).toContainText("syntax error");
      await expectNoViolations(page, "fight, error view");
    });
  });
}

test("every world in its own palette passes", async ({ page }) => {
  for (const [world, caseId] of [
    ["the-vault", "w2-01-pin-tumbler"],
    ["the-twins", "w3-01-key-mirror"],
    ["the-architect", "w4-01-melt-form"],
    ["the-foundry", "w5-01-slow-lane"],
    ["the-observatory", "w6-01-first-light"],
  ] as const) {
    await openCase(page, world, caseId, "sql");
    await page.waitForTimeout(1200); // let the entrance animation finish
    await expectNoViolations(page, `${world} fight (dark)`);
    await page.goto("/");
  }
});

test("high contrast on the light theme passes", async ({ page }) => {
  await seed(page, { theme: "light", highContrast: true });
  await page.goto("/");
  await expectNoViolations(page, "home, high contrast light");
  await page.locator('[data-world-card="boss-fights"]').click();
  await expectNoViolations(page, "roster, high contrast light");
});

for (const theme of ["dark", "light"] as Theme[]) {
  test.describe(`${theme} theme, worlds 7 to 9 and the flight`, () => {
    test("the new world rosters and the ANIM menu", async ({ page }) => {
      await seed(page, { theme });
      for (const world of ["the-labyrinth", "the-timekeeper", "the-laboratory"]) {
        await page.goto(`/#/world/${world}`);
        await page.reload();
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await expectNoViolations(page, `roster of ${world}`);
      }
      await page.getByRole("button", { name: "Animation settings" }).click();
      await expectNoViolations(page, "ANIM menu");
    });

    test("the arrival card of the flight", async ({ page }) => {
      await seed(page, { theme, travel: true });
      await page.goto("/");
      await page.locator('[data-world-card="the-laboratory"]').click();
      await expect(
        page.getByRole("dialog", { name: /Travelling to Helix-9/ }),
      ).toBeVisible();
      await expectNoViolations(page, "flight card");
    });

    test("a fight in a new world", async ({ page }) => {
      await seed(page, { theme });
      await openCase(page, "the-laboratory", "w9-01-the-spread", "sql");
      await expectNoViolations(page, "Laboratory fight");
    });
  });
}
