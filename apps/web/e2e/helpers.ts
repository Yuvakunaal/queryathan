import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Page } from "@playwright/test";
import { expect } from "./fixtures";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

export type EngineName = "python" | "sql";
export type Theme = "dark" | "light";

export function rosterOf(world: string): string[] {
  const roster = JSON.parse(
    readFileSync(join(repoRoot, "content/rosters", `${world}.json`), "utf8"),
  ) as { caseIds: string[] };
  return roster.caseIds;
}

export function titleOf(world: string, caseId: string): string {
  const data = JSON.parse(
    readFileSync(join(repoRoot, "content/cases", world, `${caseId}.json`), "utf8"),
  ) as { strings: { title: string } };
  return data.strings.title;
}

interface SeedOptions {
  /** Cases to mark as cleared, by world, so later bosses are unlocked. */
  cleared?: Record<string, string[]>;
  theme?: Theme;
  highContrast?: boolean;
  /** Show the first-time tutorial overlay instead of skipping it. */
  tutorial?: boolean;
  /** Play the rocket flight between worlds. Off in tests unless a test is about it. */
  travel?: boolean;
  /** Play the knife-cut scene after a win. On unless a test that wins and keeps going turns it off. */
  kill?: boolean;
}

/** Sets the browser's saved state before the page loads. */
export async function seed(page: Page, options: SeedOptions = {}): Promise<void> {
  const worlds = Object.fromEntries(
    Object.entries(options.cleared ?? {}).map(([world, ids]) => [
      world,
      { clearedCaseIds: ids, masteredTechniques: [], xp: 0 },
    ]),
  );
  await page.addInitScript(
    ({ worlds, theme, highContrast, tutorial, travel, kill }) => {
      if (!tutorial) localStorage.setItem("dcq.tutorialSeen", "1");
      // Only seed what is missing: the script re-runs on every navigation, and a
      // reload must see whatever the app itself saved (a chosen theme, say).
      if (localStorage.getItem("dcq.save") === null) {
        localStorage.setItem("dcq.save", JSON.stringify({ version: 1, worlds }));
      }
      if (localStorage.getItem("dcq.a11y") === null) {
        localStorage.setItem(
          "dcq.a11y",
          JSON.stringify({
            textScaleIndex: 1,
            theme,
            crtReduced: true,
            highContrast,
            travel,
            kill,
          }),
        );
      }
    },
    {
      worlds,
      theme: options.theme ?? "dark",
      highContrast: options.highContrast ?? false,
      tutorial: options.tutorial ?? false,
      travel: options.travel ?? false,
      kill: options.kill ?? true,
    },
  );
}

/** Opens a case from the home screen and gets through engine choice and boot, ready to type code. */
export async function openCase(
  page: Page,
  world: string,
  caseId: string,
  engine: EngineName,
  options: { skipBoot?: boolean } = {},
): Promise<void> {
  const roster = rosterOf(world);
  const index = roster.indexOf(caseId);
  if (index < 0) throw new Error(`${caseId} is not in ${world}'s roster`);
  await seed(page, { cleared: { [world]: roster.slice(0, index) } });
  await page.goto("/");
  await page.locator(`[data-world-card="${world}"]`).click();
  const title = titleOf(world, caseId);
  await page.getByRole("button", { name: new RegExp(`^${title},`, "i") }).click();
  await page.getByText(engine === "python" ? "PYTHON" : "SQL", { exact: true }).click();
  if (options.skipBoot) return;
  await page.getByText(/ENTER \]/).waitFor({ timeout: 120_000 });
  await page.waitForTimeout(700);
  await page.getByText(/ENTER \]/).click();
  await page.locator(".cm-content").waitFor();
}

export async function setCode(page: Page, code: string): Promise<void> {
  await page.locator(".cm-content").click();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.insertText(code);
}

export async function run(page: Page): Promise<void> {
  await page.getByRole("button", { name: /^Run/ }).click();
}

/** The victory panel appears after the kill animation. */
export async function expectWin(page: Page): Promise<string> {
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible({ timeout: 40_000 });
  return dialog.innerText();
}
