import { test, expect } from "./fixtures";
import { seed } from "./helpers";

test("the home screen lists all five worlds and the sandbox", async ({ page }) => {
  await seed(page);
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Fight your data clean/ }),
  ).toBeVisible();
  for (const world of [
    "boss-fights",
    "the-vault",
    "the-twins",
    "the-architect",
    "the-foundry",
  ]) {
    await expect(page.locator(`[data-world-card="${world}"]`)).toBeVisible();
  }
  await expect(page.getByRole("button", { name: /Sandbox/ })).toBeVisible();
});

test("only the first boss in a world is open at the start", async ({ page }) => {
  await seed(page);
  await page.goto("/");
  await page.locator('[data-world-card="boss-fights"]').click();
  await expect(page.getByRole("button", { name: /^NUL_SENTINEL,/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /^DOUBLE_TAKE,/ })).toHaveCount(0);
  await expect(page.getByText("Clear the previous boss")).toHaveCount(3);
});

test.describe("What is this?", () => {
  test("opens, traps focus, closes with Escape and returns focus", async ({ page }) => {
    await seed(page, { aboutUnseen: true });
    await page.goto("/");
    await expect(page.getByText("Start here")).toBeVisible();
    const opener = page.getByRole("button", { name: /What is this\?/ }).nth(1);
    await opener.click();
    const dialog = page.getByRole("dialog", { name: /What is Data Cleaning Quest/ });
    await expect(dialog).toBeVisible();
    for (const heading of [
      "Why clean data?",
      "How a round works",
      "What happens when you win",
      "The theme: the mess is the monster",
    ]) {
      await expect(dialog.getByRole("heading", { name: heading })).toBeVisible();
    }
    for (let i = 0; i < 25; i++) await page.keyboard.press("Tab");
    expect(
      await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]')),
    ).toBe(true);
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(opener).toBeFocused();
    await page.reload();
    await expect(page.getByText("Start here")).toHaveCount(0);
  });

  test("Start with Boss Fights goes to that world", async ({ page }) => {
    await seed(page);
    await page.goto("/");
    await page
      .getByRole("button", { name: /What is this\?/ })
      .nth(1)
      .click();
    await page.getByRole("button", { name: "Start with Boss Fights" }).click();
    await expect(page.getByRole("heading", { name: "Boss Fights" })).toBeVisible();
  });
});

test.describe("themes and accessibility settings", () => {
  test("the light theme is remembered across a reload", async ({ page }) => {
    await seed(page, { theme: "dark" });
    await page.goto("/");
    await page.getByRole("button", { name: "Light theme" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-dcq-theme", "light");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-dcq-theme", "light");
  });

  test("high contrast works on the light theme and stays light", async ({ page }) => {
    await seed(page, { theme: "light", highContrast: true });
    await page.goto("/");
    const html = page.locator("html");
    await expect(html).toHaveAttribute("data-dcq-theme", "light");
    await expect(html).toHaveAttribute("data-dcq-contrast", "high");
    const background = await page.evaluate(
      () => getComputedStyle(document.body).backgroundColor,
    );
    expect(background).toBe("rgb(255, 255, 255)");
  });

  test("first fight shows the how-it-works overlay once", async ({ page }) => {
    await seed(page, { tutorial: true });
    await page.goto("/");
    await page.locator('[data-world-card="boss-fights"]').click();
    await page.getByRole("button", { name: /^NUL_SENTINEL,/ }).click();
    await page.getByText("SQL", { exact: true }).click();
    await page.getByText(/ENTER \]/).waitFor();
    await page.waitForTimeout(700);
    await page.getByText(/ENTER \]/).click();
    await expect(page.getByRole("dialog", { name: "How a fight works" })).toBeVisible();
    await page.getByRole("button", { name: "Got it" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});
