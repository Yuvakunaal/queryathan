import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { openCase, seed } from "./helpers";

/**
 * A layout floor for every width a person is likely to use, desktop to phone: nothing makes the
 * page scroll sideways, the top bar fits, and the controls that matter are inside the screen.
 */
const SIZES = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "laptop", width: 1024, height: 768 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "phone", width: 390, height: 844 },
] as const;

async function overflow(page: Page): Promise<{ page: number; offenders: string[] }> {
  return page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const offenders: string[] = [];
    document
      .querySelectorAll<HTMLElement>("button, [role='tab'], h1, h2")
      .forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return;
        const style = getComputedStyle(el);
        if (style.visibility === "hidden") return;
        if (r.right > width + 1 || r.left < -1) {
          offenders.push(
            `${el.tagName.toLowerCase()} "${el.textContent.trim().slice(0, 30)}" at ${String(Math.round(r.left))}-${String(Math.round(r.right))}`,
          );
        }
      });
    return { page: document.documentElement.scrollWidth - width, offenders };
  });
}

for (const size of SIZES) {
  test.describe(`${size.name} (${String(size.width)}px)`, () => {
    test.use({
      viewport: { width: size.width, height: size.height },
      reducedMotion: "reduce",
    });

    test("home, a roster and the sandbox setup fit", async ({ page }) => {
      await seed(page);
      await page.goto("/");
      await page.waitForTimeout(500);
      let o = await overflow(page);
      expect(o.page, "home scrolls sideways").toBeLessThanOrEqual(1);
      expect(o.offenders, "home controls outside the screen").toEqual([]);
      await page.locator('[data-world-card="the-observatory"]').click();
      await page.waitForTimeout(500);
      o = await overflow(page);
      expect(o.page, "roster scrolls sideways").toBeLessThanOrEqual(1);
      expect(o.offenders).toEqual([]);
      await page.goto("/");
      await page.getByRole("button", { name: /Sandbox/ }).click();
      await page.waitForTimeout(400);
      o = await overflow(page);
      expect(o.page, "sandbox setup scrolls sideways").toBeLessThanOrEqual(1);
      expect(o.offenders).toEqual([]);
    });

    test("the engine choice, the intro and a fight fit", async ({ page }) => {
      test.setTimeout(150_000);
      await openCase(page, "the-twins", "w3-06-four-corners", "sql", { skipBoot: true });
      await page.waitForTimeout(500);
      let o = await overflow(page);
      expect(o.page, "intro scrolls sideways").toBeLessThanOrEqual(1);
      expect(o.offenders, "intro controls outside the screen").toEqual([]);
      await page.getByText(/ENTER \]/).waitFor({ timeout: 120_000 });
      await page.waitForTimeout(500);
      await page.keyboard.press("Enter");
      await page.locator(".cm-content").waitFor();
      await page.waitForTimeout(900);
      o = await overflow(page);
      expect(o.page, "fight scrolls sideways").toBeLessThanOrEqual(1);
      expect(o.offenders, "fight controls outside the screen").toEqual([]);
      // The top bar's controls are reachable at every width.
      await expect(page.getByRole("button", { name: "Sound settings" })).toBeInViewport();
      await expect(page.getByRole("button", { name: "< Roster" })).toBeInViewport();
    });
  });
}
