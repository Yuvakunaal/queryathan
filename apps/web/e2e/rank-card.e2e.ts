import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";
import { seed } from "./helpers";

test.use({ reducedMotion: "reduce" });

test("a finished case unlocks a shareable progress card", async ({ page }) => {
  await seed(page, { cleared: { "boss-fights": ["w1-01-nul-sentinel"] } });
  await page.goto("/");
  await page.getByRole("button", { name: "Share progress" }).click();
  const dialog = page.getByRole("dialog", { name: "Share your progress" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("img")).toHaveAttribute("aria-label", /1 case cleared/);
  const download = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Download image" }).click();
  expect((await download).suggestedFilename()).toBe("data-cleaning-quest-progress.png");
  const scan = await new AxeBuilder({ page }).include('[role="dialog"]').analyze();
  expect(scan.violations).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("button", { name: "Share progress" })).toBeFocused();
});

test("a fresh visitor does not see the share button", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "What is this?" }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Share progress" })).toHaveCount(0);
});
