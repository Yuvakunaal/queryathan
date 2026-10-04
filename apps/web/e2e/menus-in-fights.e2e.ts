import { expect, test } from "./fixtures";
import type { Page } from "@playwright/test";
import { openCase } from "./helpers";

/** True when the point at the middle of `selector` belongs to it (nothing is drawn on top of it). */
async function onTop(page: Page, selector: string): Promise<boolean> {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return false;
    const r = el.getBoundingClientRect();
    const hit = document.elementFromPoint(
      r.x + r.width / 2,
      r.y + Math.min(r.height / 2, 40),
    );
    return hit !== null && el.contains(hit);
  }, selector);
}

test("the sound menu opens over the fight and can be used", async ({ page }) => {
  await openCase(page, "boss-fights", "w1-01-nul-sentinel", "sql");
  await page.waitForTimeout(1200);
  await page.getByRole("button", { name: "Sound settings" }).click();
  const menu = page.getByRole("group", { name: "Sound settings" });
  await expect(menu).toBeVisible();
  expect(await onTop(page, '[role="group"][aria-label="Sound settings"]')).toBe(true);
  await menu.getByRole("checkbox", { name: /Typing/ }).uncheck();
  await expect(menu.getByRole("checkbox", { name: /Typing/ })).not.toBeChecked();
});

test("the sound menu opens on every screen of a fight, in every world", async ({
  page,
}) => {
  test.setTimeout(240_000);
  for (const [world, caseId] of [
    ["the-vault", "w2-01-pin-tumbler"],
    ["the-twins", "w3-01-key-mirror"],
    ["the-architect", "w4-01-melt-form"],
    ["the-foundry", "w5-01-slow-lane"],
    ["the-observatory", "w6-01-first-light"],
  ] as const) {
    await openCase(page, world, caseId, "sql");
    await page.waitForTimeout(1200);
    await page.getByRole("button", { name: "Sound settings" }).click();
    await expect(page.getByRole("group", { name: "Sound settings" })).toBeVisible();
    expect(await onTop(page, '[role="group"][aria-label="Sound settings"]')).toBe(true);
    await page.keyboard.press("Escape");
    await page.goto("/");
  }
});

test("SQL help opens over the editor and the data, not behind them", async ({ page }) => {
  await openCase(page, "boss-fights", "w1-01-nul-sentinel", "sql");
  await page.waitForTimeout(1200);
  await page.getByRole("button", { name: "SQL help" }).click();
  await expect(page.getByRole("region", { name: "SQL help" })).toBeVisible();
  expect(await onTop(page, '[role="region"][aria-label="SQL help"]')).toBe(true);
});
