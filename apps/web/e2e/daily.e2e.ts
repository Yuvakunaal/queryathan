import { expect, test } from "./fixtures";
import { seed } from "./helpers";

test("today's case offers an unlocked case and opens its fight", async ({ page }) => {
  await seed(page);
  await page.goto("/");
  const card = page.locator("[data-daily-card]");
  await expect(card).toBeVisible();
  await expect(card).toContainText("Clear any case today to start a streak");
  await card.click();
  await expect(page.getByRole("button", { name: /Python|SQL/ }).first()).toBeVisible({
    timeout: 20_000,
  });
});

test("a streak shows on the card and the sound toggle remembers its state", async ({
  page,
}) => {
  await seed(page);
  const d = new Date();
  const key = `${String(d.getFullYear())}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  await page.addInitScript((today) => {
    localStorage.setItem("dcq.streak", JSON.stringify({ last: today, count: 3 }));
  }, key);
  await page.goto("/");
  await expect(page.locator("[data-daily-card]")).toContainText("3-day streak");
  const sound = page.getByRole("button", { name: "Sound effects" });
  await expect(sound).toHaveAttribute("aria-pressed", "false");
  await sound.click();
  await expect(sound).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(page.getByRole("button", { name: "Sound effects" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});
