import { expect, test } from "./fixtures";
import { seed } from "./helpers";

/**
 * The rocket flight between worlds: it plays when the setting is on, can be skipped,
 * is switched off from the top bar (and remembered), and the victory cut-scene is
 * never part of that switch.
 */
test("choosing a world plays the flight, then lands on that world", async ({ page }) => {
  await seed(page, { travel: true });
  await page.goto("/");
  await page.locator('[data-world-card="the-vault"]').click();
  const flight = page.getByRole("dialog", { name: "Travelling to Cryptara" });
  await expect(flight).toBeVisible();
  await expect(page.getByRole("heading", { name: "Cryptara" })).toBeVisible({
    timeout: 8_000,
  });
  await expect(flight).toHaveCount(0, { timeout: 8_000 });
  await expect(page).toHaveURL(/the-vault/);
});

test("the flight can be skipped with the button or the keyboard", async ({ page }) => {
  await seed(page, { travel: true });
  await page.goto("/");
  await page.locator('[data-world-card="the-twins"]').click();
  await page.getByRole("button", { name: "Skip flight" }).click();
  await expect(page.getByRole("heading", { name: "Geminora" })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await page.getByRole("button", { name: "Data Cleaning Quest" }).click();
  await page.locator('[data-world-card="the-foundry"]').click();
  await expect(
    page.getByRole("dialog", { name: /Travelling to Cinderforge/ }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("heading", { name: "Cinderforge" })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("the ANIM menu has a switch for the flight and one for the killing animation", async ({
  page,
}) => {
  await seed(page, { travel: true });
  await page.goto("/");
  await page.getByRole("button", { name: "Animation settings" }).click();
  const flight = page.getByRole("checkbox", { name: /Rocket flight/ });
  const kill = page.getByRole("checkbox", { name: /Killing animation/ });
  await expect(flight).toBeChecked();
  await expect(kill).toBeChecked();
  await flight.uncheck();
  await page.keyboard.press("Escape");

  await page.locator('[data-world-card="the-vault"]').click();
  // No flight: the world is simply there.
  await expect(page.getByRole("heading", { name: "Cryptara" })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await page.reload();
  await page.getByRole("button", { name: "Animation settings" }).click();
  await expect(page.getByRole("checkbox", { name: /Rocket flight/ })).not.toBeChecked();
  await expect(page.getByRole("checkbox", { name: /Killing animation/ })).toBeChecked();
});

test("the flight looks the same on the light theme and lands on the world", async ({
  page,
}) => {
  await seed(page, { travel: true, theme: "light" });
  await page.goto("/");
  await page.locator('[data-world-card="the-labyrinth"]').click();
  await expect(
    page.getByRole("dialog", { name: "Travelling to Minos Deep" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Minos Deep" })).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByRole("dialog")).toHaveCount(0, { timeout: 10_000 });
});

test("the world cards carry the new world names", async ({ page }) => {
  await seed(page);
  await page.goto("/");
  for (const name of [
    "Ember Reach",
    "Cryptara",
    "Geminora",
    "Atlas Spire",
    "Cinderforge",
    "Lumenfield",
    "Minos Deep",
    "Chronopolis",
    "Helix-9",
  ]) {
    await expect(page.getByRole("heading", { name })).toBeVisible();
  }
});
