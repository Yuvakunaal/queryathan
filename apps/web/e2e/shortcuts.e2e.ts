import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";
import { openCase, seed, setCode } from "./helpers";

test.use({ reducedMotion: "reduce" });

test("pressing ? opens the shortcuts sheet, and Escape closes it and returns focus", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Keyboard shortcuts" }).focus();
  await page.keyboard.press("Tab"); // somewhere else, not typing
  await page.keyboard.press("?");
  const dialog = page.getByRole("dialog", { name: "Keyboard shortcuts" });
  await expect(dialog).toBeVisible();
  // Run, format, panel resizing and table moves are all there.
  await expect(dialog).toContainText("Run.");
  await expect(dialog).toContainText("Tidy the SQL");
  await expect(dialog).toContainText("larger steps");
  await expect(dialog).toContainText("swap it with the previous or next table");
  const scan = await new AxeBuilder({ page }).include('[role="dialog"]').analyze();
  expect(scan.violations).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("the ? button in the top bar opens it too, and focus stays inside while it is open", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Keyboard shortcuts" }).click();
  const dialog = page.getByRole("dialog", { name: "Keyboard shortcuts" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Close" })).toBeFocused();
  for (let i = 0; i < 4; i += 1) await page.keyboard.press("Tab");
  expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  await dialog.getByRole("button", { name: "Close" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("button", { name: "Keyboard shortcuts" })).toBeFocused();
});

test("typing a question mark in the editor writes a question mark and does not open the sheet", async ({
  page,
}) => {
  await openCase(page, "boss-fights", "w1-01-nul-sentinel", "sql");
  await setCode(page, "-- why");
  await page.keyboard.press("?");
  await expect(page.locator(".cm-content")).toContainText("-- why?");
  await expect(page.getByRole("dialog", { name: "Keyboard shortcuts" })).toHaveCount(0);
  // From the Run button (not typing) it does open.
  await page.getByRole("button", { name: /^Run/ }).focus();
  await page.keyboard.press("?");
  await expect(page.getByRole("dialog", { name: "Keyboard shortcuts" })).toBeVisible();
});

test("the sheet is drawn with the app's own look: a solid panel and the mono font", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/");
  await page.keyboard.press("?");
  const dialog = page.getByRole("dialog", { name: "Keyboard shortcuts" });
  await expect(dialog).toBeVisible();
  const style = await dialog.evaluate((el) => {
    const s = getComputedStyle(el);
    const kbd = el.querySelector("kbd");
    return {
      background: s.backgroundColor,
      border: s.borderTopWidth,
      kbdFont: kbd ? getComputedStyle(kbd).fontFamily : "",
    };
  });
  expect(style.background).not.toBe("rgba(0, 0, 0, 0)");
  expect(style.border).not.toBe("0px");
  expect(style.kbdFont).toContain("Mono");
});
