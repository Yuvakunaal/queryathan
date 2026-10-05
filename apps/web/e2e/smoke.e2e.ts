import { test, expect } from "./fixtures";
import { seed, titleOf } from "./helpers";

test("the home screen lists all nine worlds and the sandbox", async ({ page }) => {
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
    "the-observatory",
    "the-labyrinth",
    "the-timekeeper",
    "the-laboratory",
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
    const opener = page.getByRole("button", { name: /What is this\?/ });
    await opener.click();
    const dialog = page.getByRole("dialog", { name: /What is Queryathan/ });
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

  test("Start with Ember Reach goes to that world", async ({ page }) => {
    await seed(page);
    await page.goto("/");
    await page.getByRole("button", { name: /What is this\?/ }).click();
    await page.getByRole("button", { name: "Start with Ember Reach" }).click();
    await expect(page.getByRole("heading", { name: "Ember Reach" })).toBeVisible();
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

test("the top bar stays visible through every loading step of a fight, in every world", async ({
  page,
}) => {
  test.setTimeout(150_000);
  for (const [world, caseId, rail] of [
    ["boss-fights", "w1-01-nul-sentinel", "EMBER-REACH"],
    ["the-vault", "w2-01-pin-tumbler", "CRYPTARA"],
    ["the-twins", "w3-01-key-mirror", "GEMINORA"],
    ["the-architect", "w4-01-melt-form", "ATLAS-SPIRE"],
    ["the-foundry", "w5-01-slow-lane", "CINDERFORGE"],
    ["the-observatory", "w6-01-first-light", "LUMENFIELD"],
  ] as const) {
    await seed(page);
    await page.goto("/");
    await page.locator(`[data-world-card="${world}"]`).click();
    const bar = page.getByRole("button", { name: "Sound settings" });
    const title = titleOf(world, caseId);
    await page.getByRole("button", { name: new RegExp(`^${title},`, "i") }).click();
    // Choosing an engine.
    await expect(bar).toBeVisible();
    await expect(page.getByRole("button", { name: "< Roster" })).toBeVisible();
    await page.getByText("SQL", { exact: true }).click();
    // Starting the engine, then the boot sequence.
    await expect(bar).toBeVisible();
    await expect(page.getByText(new RegExp(`^${rail} //`))).toBeVisible();
    await page.getByText(/ENTER \]/).waitFor({ timeout: 120_000 });
    await expect(bar).toBeVisible();
    await expect(page.getByRole("button", { name: "< Roster" })).toBeVisible();
    await page.getByRole("button", { name: "< Roster" }).click();
    await expect(page.locator("[data-world]").first()).toBeVisible();
    await page.goto("/");
  }
});
