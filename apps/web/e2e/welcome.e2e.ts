import { expect, test } from "./fixtures";
import { seed } from "./helpers";

test("the home page greets you with a name that types, erases and changes, forever", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await seed(page);
  await page.goto("/");
  const line = page.locator("[data-welcome]");
  await expect(line).toContainText("Welcome");
  // There is exactly one "What is this?" entry point now: the link in the top bar.
  await expect(page.getByRole("button", { name: /What is this\?/ })).toHaveCount(1);
  const names = new Set<string>();
  const until = Date.now() + 14_000;
  while (Date.now() < until && names.size < 3) {
    const text = ((await line.textContent()) ?? "")
      .replace(/^Welcome/, "")
      .replace(/[<>]/g, "")
      .trim();
    if (text.length > 2) names.add(text);
    await page.waitForTimeout(150);
  }
  expect(names.size, "typed more than one distinct name").toBeGreaterThan(1);
});

test("with reduced motion the greeting is still", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await seed(page);
  await page.goto("/");
  await expect(page.locator("[data-welcome]")).toContainText("Explorer");
  await page.waitForTimeout(1500);
  await expect(page.locator("[data-welcome]")).toContainText("Explorer");
});

test("screen readers get one calm sentence, not the typing", async ({ page }) => {
  await seed(page);
  await page.goto("/");
  await expect(
    page.getByText("Welcome, explorer. Choose a world below to begin."),
  ).toBeAttached();
  await expect(page.locator("[data-welcome]")).toHaveAttribute("aria-hidden", "true");
});

test("the caret stays on the same line, at the same height, from the first letter to the last", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await seed(page);
  await page.goto("/");
  const caret = page.locator("[data-caret]");
  await expect(caret).toBeAttached();
  const tops: number[] = [];
  const heights: number[] = [];
  const until = Date.now() + 9_000;
  while (Date.now() < until) {
    const box = await caret.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { top: r.top, height: r.height };
    });
    tops.push(box.top);
    heights.push(box.height);
    await page.waitForTimeout(90);
  }
  expect(Math.max(...tops) - Math.min(...tops)).toBeLessThan(0.6);
  expect(Math.max(...heights) - Math.min(...heights)).toBeLessThan(0.6);
});
