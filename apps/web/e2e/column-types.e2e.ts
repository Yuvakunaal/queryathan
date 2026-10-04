import { expect, test } from "./fixtures";
import { openCase } from "./helpers";

test("hovering a column name shows just its MySQL type, and a column chip does the same on focus", async ({
  page,
}) => {
  await openCase(page, "the-twins", "w3-02-ghost-twin", "sql");
  await page.waitForTimeout(1200);
  const header = (name: string) =>
    page.locator('#pane-data [role="columnheader"]', { hasText: name }).first();
  const tip = page.getByRole("tooltip");
  await header("ORDER_ID").hover();
  await expect(tip).toBeVisible();
  // Only the type: nothing else about the column.
  await expect(tip).toHaveText("SMALLINT");
  await header("AMOUNT").hover();
  await expect(page.getByRole("tooltip")).toHaveText(/^DECIMAL\(\d+,2\)$/);
  await header("ITEM").hover();
  await expect(page.getByRole("tooltip")).toHaveText(/^VARCHAR\(\d+\)$/);

  // The chips above the editor work from the keyboard too, for both tables.
  await page.getByRole("button", { name: "city", exact: true }).focus();
  await expect(page.getByRole("tooltip")).toHaveText(/^VARCHAR\(\d+\)$/);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  await page.getByRole("button", { name: "amount", exact: true }).focus();
  await expect(page.getByRole("tooltip")).toHaveText(/^DECIMAL\(\d+,2\)$/);
});

test("the tooltip never gets in the way: it disappears when the pointer leaves", async ({
  page,
}) => {
  await openCase(page, "boss-fights", "w1-01-nul-sentinel", "sql");
  await page.waitForTimeout(1200);
  await page.locator('#pane-data [role="columnheader"]', { hasText: "TEMP_C" }).hover();
  const tip = page.getByRole("tooltip");
  await expect(tip).toHaveText(/^DECIMAL\(\d+,\d+\)$/);
  await page.mouse.move(5, 400);
  await expect(tip).toHaveCount(0);
});

test("Python help opens beside the editor, searches across topics, and inserts", async ({
  page,
}) => {
  await openCase(page, "boss-fights", "w1-01-nul-sentinel", "python");
  await page.getByRole("button", { name: "Python help" }).click();
  const help = page.getByRole("region", { name: "Python help" });
  await expect(
    help.getByRole("button", { name: "Missing values and repeats" }),
  ).toBeVisible();
  await expect(help).toContainText("The first n rows");
  await help.getByRole("searchbox", { name: "Search Python help" }).fill("rolling");
  await expect(help).toContainText("A moving average over the last n rows");
  await help.getByRole("button", { name: /rolling\(window/ }).click();
  await expect(help).toBeHidden();
  await expect(page.locator(".cm-content")).toContainText(
    ".rolling(7, min_periods=1).mean()",
  );
});
