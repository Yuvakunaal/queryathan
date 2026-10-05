import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";
import { openCase, seed } from "./helpers";

/**
 * On a phone: the option buttons collapse into one menu that slides in from the right, and
 * the boot prompt asks you to touch the screen instead of pressing Enter.
 */
test.describe("phone", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });

  test("the options live in a right-hand drawer, with large rows that work", async ({
    page,
  }) => {
    await seed(page, { travel: false });
    await page.goto("/");
    // No row of tiny buttons, and no pop-up menus that run off the screen.
    await expect(page.getByRole("button", { name: "Sound settings" })).toBeHidden();
    await expect(page.getByRole("button", { name: "Animation settings" })).toBeHidden();
    const open = page.getByRole("button", { name: "Open menu" });
    await expect(open).toBeInViewport();
    await open.click();

    const drawer = page.getByRole("dialog", { name: "Menu" });
    await expect(drawer).toBeVisible();
    // Once it has slid in, it sits against the right edge and inside the screen.
    await expect
      .poll(async () => {
        const box = await drawer.boundingBox();
        return Math.round((box?.x ?? 0) + (box?.width ?? 0));
      })
      .toBe(390);
    expect((await drawer.boundingBox())?.x ?? 0).toBeGreaterThan(20);

    // Every option from the top bar is here.
    for (const name of [
      "Light theme",
      "High contrast",
      "CRT screen effect",
      "Effects",
      "Typing",
      "Rocket flight",
      "Killing animation",
    ]) {
      await expect(drawer.getByRole("switch", { name: new RegExp(name) })).toBeVisible();
    }
    await expect(drawer.getByRole("slider")).toBeVisible();
    await expect(
      drawer.getByRole("button", { name: "Increase text size" }),
    ).toBeVisible();

    // They work, and are remembered.
    await drawer.getByRole("switch", { name: /Light theme/ }).check();
    await expect(page.locator("html")).toHaveAttribute("data-dcq-theme", "light");
    await drawer.getByRole("switch", { name: /Rocket flight/ }).uncheck();
    await drawer.getByRole("button", { name: "Increase text size" }).click();
    await expect(drawer).toContainText("113%");

    // Escape closes it and focus goes back to the menu button.
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
    await expect(open).toBeFocused();
    await page.reload();
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(page.getByRole("switch", { name: /Rocket flight/ })).not.toBeChecked();
  });

  for (const theme of ["dark", "light"] as const) {
    test(`the drawer passes the accessibility scan (${theme})`, async ({ page }) => {
      await seed(page, { theme, travel: false });
      await page.goto("/");
      await page.getByRole("button", { name: "Open menu" }).click();
      await expect(page.getByRole("dialog", { name: "Menu" })).toBeVisible();
      await page.waitForTimeout(500);
      const results = await new AxeBuilder({ page })
        .include('[role="dialog"]')
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(
        results.violations.map((v) => `${v.id}: ${v.help}`),
        "accessibility violations in the menu drawer",
      ).toEqual([]);
    });
  }

  test("tapping the dark area closes the drawer, and Tips opens from it", async ({
    page,
  }) => {
    await seed(page);
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(page.getByRole("dialog", { name: "Menu" })).toBeVisible();
    await page.mouse.click(30, 400);
    await expect(page.getByRole("dialog", { name: "Menu" })).toBeHidden();

    await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("button", { name: "SQL and Python tips" }).click();
    await expect(page.getByRole("dialog", { name: /Tips/ })).toBeVisible();
    await expect(page.getByRole("dialog", { name: "Menu" })).toHaveCount(0);
  });

  test("the menu is on every screen: roster and fight too", async ({ page }) => {
    await seed(page, { cleared: { "boss-fights": [] } });
    await page.goto("/#/world/boss-fights");
    await expect(page.getByRole("button", { name: "Open menu" })).toBeInViewport();
    await openCase(page, "boss-fights", "w1-01-nul-sentinel", "sql", { skipBoot: true });
    await expect(page.getByRole("button", { name: "Open menu" })).toBeInViewport();
  });

  test("the boot prompt says to touch the screen, and a tap anywhere starts the fight", async ({
    page,
  }) => {
    test.setTimeout(150_000);
    await openCase(page, "boss-fights", "w1-01-nul-sentinel", "sql", { skipBoot: true });
    // Wait until the whole prompt has been typed (a tap while it types just skips ahead).
    await expect(page.getByText(/TAP \].*engage NUL_SENTINEL/)).toBeVisible({
      timeout: 120_000,
    });
    await expect(page.getByText(/ENTER \]/)).toHaveCount(0);
    await page.waitForTimeout(700);
    // A tap on empty screen, nowhere near the prompt.
    await page.touchscreen.tap(200, 500);
    await page.locator(".cm-content").waitFor({ timeout: 20_000 });
  });
});

test("on a desktop there is no menu button, only the row of options", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Open menu" })).toBeHidden();
  await expect(page.getByRole("button", { name: "Sound settings" })).toBeVisible();
});
