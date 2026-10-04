import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";
import { openCase, seed } from "./helpers";

test.use({ reducedMotion: "reduce" });

const BOOK = "Tips: SQL and Python";

test("the book button opens Tips with SQL and Python, and Escape closes it", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/");
  await page.getByRole("button", { name: BOOK }).click();
  const dialog = page.getByRole("dialog", { name: "Tips" });
  await expect(dialog).toBeVisible();
  // SQL first when there is no fight; the topics and entries are there.
  await expect(dialog.getByRole("button", { name: "SQL", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(dialog).toContainText("Dates and time");
  await expect(dialog).toContainText("DATE_TRUNC('month', date)");
  await expect(dialog).toContainText("Open a fight and click an entry");
  await dialog.getByRole("button", { name: "Python", exact: true }).click();
  await expect(dialog).toContainText("Missing values and repeats");
  await expect(dialog).toContainText("df.head(n)");
  // Search works across topics.
  await dialog.getByRole("searchbox", { name: "Search Python tips" }).fill("rolling");
  await expect(dialog).toContainText("A moving average over the last n rows");
  const scan = await new AxeBuilder({ page }).include('[role="dialog"]').analyze();
  expect(scan.violations).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("button", { name: BOOK })).toBeFocused();
});

test("it is drawn with the app's look, and the keyboard shortcuts button is gone", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Keyboard shortcuts" })).toHaveCount(0);
  await page.keyboard.press("?");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: BOOK }).click();
  const dialog = page.getByRole("dialog", { name: "Tips" });
  const style = await dialog.evaluate((el) => {
    const s = getComputedStyle(el);
    return { background: s.backgroundColor, border: s.borderTopWidth };
  });
  expect(style.background).not.toBe("rgba(0, 0, 0, 0)");
  expect(style.border).not.toBe("0px");
});

test("inside a fight, clicking an entry for the language you are writing inserts it", async ({
  page,
}) => {
  await openCase(page, "boss-fights", "w1-01-nul-sentinel", "sql");
  await page.getByRole("button", { name: BOOK }).click();
  const dialog = page.getByRole("dialog", { name: "Tips" });
  // It opens on the language of the fight.
  await expect(dialog.getByRole("button", { name: "SQL", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(dialog).toContainText("Click an entry to put it in your editor");
  await dialog.getByRole("searchbox", { name: "Search SQL tips" }).fill("coalesce");
  await dialog.getByRole("button", { name: /COALESCE\(a, b/ }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator(".cm-content")).toContainText("COALESCE(");
  // The other language is reading only.
  await page.getByRole("button", { name: BOOK }).click();
  await page
    .getByRole("dialog", { name: "Tips" })
    .getByRole("button", { name: "Python", exact: true })
    .click();
  await expect(page.getByRole("dialog", { name: "Tips" })).toContainText(
    "You are writing SQL; switch to it to insert entries.",
  );
  await expect(
    page
      .getByRole("dialog", { name: "Tips" })
      .getByRole("button", { name: /df\.head\(n\)/ }),
  ).toHaveCount(0);
});
