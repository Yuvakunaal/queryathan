import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { openCase, rosterOf, seed } from "./helpers";

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

// The largest text size (A+) is where layouts break first.
for (const size of SIZES) {
  test.describe(`largest text, ${size.name} (${String(size.width)}px)`, () => {
    test.use({
      viewport: { width: size.width, height: size.height },
      reducedMotion: "reduce",
    });

    test("home, a roster and a fight still fit", async ({ page }) => {
      test.setTimeout(150_000);
      await page.addInitScript(() => {
        window.localStorage.setItem(
          "dcq.a11y",
          JSON.stringify({
            textScaleIndex: 3,
            theme: "dark",
            crtReduced: true,
            highContrast: false,
          }),
        );
      });
      await seed(page, { cleared: { "the-twins": rosterOf("the-twins").slice(0, 4) } });
      await page.goto("/");
      await page.waitForTimeout(400);
      let o = await overflow(page);
      expect(o.page, "home scrolls sideways").toBeLessThanOrEqual(1);
      expect(o.offenders).toEqual([]);
      await page.locator('[data-world-card="the-observatory"]').click();
      await page.waitForTimeout(400);
      o = await overflow(page);
      expect(o.page, "roster scrolls sideways").toBeLessThanOrEqual(1);
      expect(o.offenders).toEqual([]);
      await openCase(page, "the-twins", "w3-06-four-corners", "sql", { skipBoot: true });
      await page.getByText(/ENTER \]/).waitFor({ timeout: 120_000 });
      await page.waitForTimeout(500);
      await page.keyboard.press("Enter");
      await page.locator(".cm-content").waitFor();
      await page.waitForTimeout(900);
      o = await overflow(page);
      expect(o.page, "fight scrolls sideways").toBeLessThanOrEqual(1);
      expect(o.offenders, "fight controls outside the screen").toEqual([]);
    });
  });
}

// The big titles wrap onto two lines, and with tight line spacing the tail of a letter such as
// y or g touches the top of a tall letter such as l or h on the line below.
test("big page titles leave room between their lines", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  const ratio = async (): Promise<number> =>
    page.evaluate(() => {
      const h1 = document.querySelector("h1");
      if (!h1) return 0;
      const s = getComputedStyle(h1);
      return parseFloat(s.lineHeight) / parseFloat(s.fontSize);
    });
  await seed(page);
  await page.goto("/");
  expect(await ratio()).toBeGreaterThanOrEqual(1.12);
  await page.locator('[data-world-card="boss-fights"]').click();
  await expect(page.getByRole("heading", { name: "Ember Reach" })).toBeVisible();
  expect(await ratio()).toBeGreaterThanOrEqual(1.12);
  await page.goto("/#/sandbox");
  await page.reload();
  await expect(page.getByRole("heading", { name: "Bring your own data." })).toBeVisible();
  expect(await ratio()).toBeGreaterThanOrEqual(1.12);
});
