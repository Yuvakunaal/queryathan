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

test.describe("phone editor tools", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });

  async function intoFight(page: import("@playwright/test").Page): Promise<void> {
    await openCase(page, "boss-fights", "w1-01-nul-sentinel", "sql", { skipBoot: true });
    await expect(page.getByText(/touch anywhere to engage NUL_SENTINEL/)).toBeVisible({
      timeout: 120_000,
    });
    await page.waitForTimeout(700);
    await page.touchscreen.tap(200, 520);
    await page.locator(".cm-content").waitFor({ timeout: 20_000 });
  }

  test("help, format, reset and clear are small icon buttons that keep their names", async ({
    page,
  }) => {
    test.setTimeout(150_000);
    await intoFight(page);
    for (const name of ["SQL help", "Format", "Reset", "Clear"]) {
      const button = page.getByRole("button", { name, exact: true });
      await expect(button).toBeVisible();
      const box = await button.boundingBox();
      // Icon-sized, still a comfortable touch target, and no words drawn on it.
      expect(box?.width ?? 0).toBeLessThan(48);
      expect(box?.width ?? 0).toBeGreaterThanOrEqual(36);
      // The words are kept for screen readers but not drawn.
      const label = await button.locator("span").last().boundingBox();
      expect(label?.width ?? 0).toBeLessThanOrEqual(2);
    }
  });

  test("typing lifts the editor above the keyboard, and Done or Run brings the page back", async ({
    page,
  }) => {
    test.setTimeout(150_000);
    await intoFight(page);
    const root = page.locator('[data-world][class*="fightRoot"]');
    await expect(root).not.toHaveAttribute("data-typing", "true");
    await page.locator(".cm-content").tap();
    await expect(root).toHaveAttribute("data-typing", "true");
    // Only what is needed to type is left: the task as a one-liner, the editor, its tools, Run.
    await expect(page.getByRole("button", { name: "Done" })).toBeVisible();
    await expect(page.getByText("Your task")).toBeHidden();
    // Opening the task keeps typing mode (focus is still in the typing area).
    await page.getByText(/see the task/).tap();
    await expect(page.locator(`[class*="typingTask"] p`)).toBeVisible();
    await expect(root).toHaveAttribute("data-typing", "true");
    await page.locator(".cm-content").tap();
    // The keyboard takes most of the screen: the editor and Run stay inside what is left.
    await page.setViewportSize({ width: 390, height: 430 });
    await page.keyboard.type(" -- hello");
    const editor = await page.locator(".cm-content").boundingBox();
    const run = await page.getByRole("button", { name: /^Run/ }).boundingBox();
    expect((editor?.y ?? 0) + (editor?.height ?? 0)).toBeLessThanOrEqual(431);
    expect((run?.y ?? 0) + (run?.height ?? 0)).toBeLessThanOrEqual(431);
    expect(editor?.height ?? 0).toBeGreaterThan(60);
    await expect(page.locator(".cm-content")).toContainText("-- hello");
    // Done puts the keyboard away and the whole page back.
    await page.getByRole("button", { name: "Done" }).click();
    await expect(root).not.toHaveAttribute("data-typing", "true");
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByText("Your task")).toBeVisible();
    // Run from the keyboard view also ends it, and the result is brought into view.
    await page.locator(".cm-content").tap();
    await expect(root).toHaveAttribute("data-typing", "true");
    await page.getByRole("button", { name: /^Run/ }).tap();
    await expect(root).not.toHaveAttribute("data-typing", "true");
    await expect(page.getByRole("tab", { name: "Output" })).toBeVisible();
  });

  test("a dock stays at the bottom: Run, Edit and Result are always one tap away", async ({
    page,
  }) => {
    test.setTimeout(150_000);
    await intoFight(page);
    const inView = async (name: string | RegExp): Promise<boolean> => {
      const box = await page.getByRole("button", { name }).boundingBox();
      return (box?.y ?? 9999) + (box?.height ?? 0) <= 844 && (box?.y ?? -1) >= 0;
    };
    // At the top of the page, with the editor far below, the dock is still on screen.
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    expect(await inView(/^Run/)).toBe(true);
    expect(await inView("Edit query")).toBe(true);
    expect(await inView("See result")).toBe(true);

    // Result takes you to the table; Edit takes you straight back to typing, no scrolling hunt.
    await page.getByRole("button", { name: "See result" }).tap();
    await page.waitForTimeout(700);
    await page.getByRole("button", { name: "Edit query" }).tap();
    const root = page.locator('[data-world][class*="fightRoot"]');
    await expect(root).toHaveAttribute("data-typing", "true");
    await expect(page.locator(".cm-content")).toBeInViewport();
    await page.keyboard.type(" -- again");
    await expect(page.locator(".cm-content")).toContainText("-- again");

    // Run brings the result up; Edit is again one tap away.
    await page.getByRole("button", { name: /^Run/ }).tap();
    await expect(root).not.toHaveAttribute("data-typing", "true");
    expect(await inView("Edit query")).toBe(true);
    await page.getByRole("button", { name: "Edit query" }).tap();
    await expect(root).toHaveAttribute("data-typing", "true");
    await expect(page.locator(".cm-content")).toBeInViewport();

    // Done leaves the editor where the player is looking.
    await page.getByRole("button", { name: "Done" }).tap();
    await expect(page.locator(".cm-content")).toBeInViewport();
  });

  test("SQL help opens as a bottom sheet with two topics and a More modal", async ({
    page,
  }) => {
    test.setTimeout(150_000);
    await intoFight(page);
    await page.getByRole("button", { name: "SQL help" }).click();
    const sheet = page.getByRole("dialog", { name: "SQL help" });
    await expect(sheet).toBeVisible();
    // Against the bottom edge, full width.
    await expect
      .poll(async () => {
        const box = await sheet.boundingBox();
        return Math.round((box?.y ?? 0) + (box?.height ?? 0));
      })
      .toBe(844);
    // Only two topics on the line, then More.
    const topics = sheet.getByRole("group", { name: "Topics" });
    await expect(topics.getByRole("button")).toHaveCount(3);
    await topics.getByRole("button", { name: "More", exact: true }).click();
    const modal = page.getByRole("dialog", { name: "All topics" });
    await expect(modal).toBeVisible();
    await expect(modal.getByRole("button", { name: /^(?!Close)/ }).first()).toBeVisible();
    expect(await modal.getByRole("button").count()).toBeGreaterThan(7);
    await modal.getByRole("button", { name: "Missing values" }).click();
    await expect(modal).toBeHidden();
    // The chosen topic is now showing (and stays visible among the two).
    await expect(
      topics.getByRole("button", { name: "Missing values", pressed: true }),
    ).toBeVisible();
    // Picking an entry puts it in the editor and closes the sheet.
    await sheet
      .getByRole("button", { name: /COALESCE/ })
      .first()
      .click();
    await expect(sheet).toBeHidden();
    await expect(page.locator(".cm-content")).toContainText("COALESCE");
  });
});

test("on a desktop the editor tools keep their words and help is a pop-over", async ({
  page,
}) => {
  test.setTimeout(150_000);
  await openCase(page, "boss-fights", "w1-01-nul-sentinel", "sql");
  for (const name of ["Format", "Reset", "Clear"]) {
    await expect(page.getByRole("button", { name, exact: true })).toHaveText(name);
  }
  await page.getByRole("button", { name: "SQL help" }).click();
  await expect(page.getByRole("region", { name: "SQL help" })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "SQL help" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "More", exact: true })).toHaveCount(0);
  // The phone dock does not exist on a desktop.
  await expect(page.getByRole("button", { name: "Edit query" })).toBeHidden();
  await expect(page.getByRole("button", { name: "See result" })).toBeHidden();
});

test("on a desktop there is no menu button, only the row of options", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Open menu" })).toBeHidden();
  await expect(page.getByRole("button", { name: "Sound settings" })).toBeVisible();
});
