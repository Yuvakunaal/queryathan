import { expect, test } from "./fixtures";
import { openCase, run, setCode } from "./helpers";

test("the browser's Back and Forward buttons move between screens", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-world-card="the-vault"]').click();
  await expect(page.getByRole("heading", { name: "The Vault" })).toBeVisible();
  expect(page.url()).toContain("#/world/the-vault");
  await expect(page).toHaveTitle(/The Vault/);
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: /Fight your data clean/ }),
  ).toBeVisible();
  await expect(page).toHaveTitle("Data Cleaning Quest");
  await page.goForward();
  await expect(page.getByRole("heading", { name: "The Vault" })).toBeVisible();
});

test("a roster address opens that world, and a bad address opens home", async ({
  page,
}) => {
  await page.goto("/#/world/the-twins");
  await expect(page.getByRole("heading", { name: "The Twins" })).toBeVisible();
  await page.goto("/#/world/nonsense");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: /Fight your data clean/ }),
  ).toBeVisible();
});

test("Back from a fight returns to the roster, and the code typed there is kept", async ({
  page,
}) => {
  await openCase(page, "boss-fights", "w1-01-nul-sentinel", "sql");
  await setCode(page, "SELECT COUNT(*) AS keep_me FROM data;");
  await page.goBack();
  await expect(page.getByRole("heading", { name: "Boss Fights" })).toBeVisible();
  // Open it again: the same query is waiting.
  await page.getByRole("button", { name: /^NUL_SENTINEL,/i }).click();
  await page.getByText("SQL", { exact: true }).click();
  await page.getByText(/ENTER \]/).waitFor({ timeout: 120_000 });
  await page.waitForTimeout(600);
  await page.keyboard.press("Enter");
  await expect(page.locator(".cm-content")).toContainText("keep_me");
  // And it survives a full reload of the page too.
  await page.reload();
  await page.getByText("SQL", { exact: true }).click();
  await page.getByText(/ENTER \]/).waitFor({ timeout: 120_000 });
  await page.waitForTimeout(600);
  await page.keyboard.press("Enter");
  await expect(page.locator(".cm-content")).toContainText("keep_me");
  // Reset puts the starting code back and forgets the draft.
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(page.locator(".cm-content")).not.toContainText("keep_me");
  await run(page);
});

test("in Python the starting table stays visible after df becomes the answer", async ({
  page,
}) => {
  await openCase(page, "the-observatory", "w6-01-first-light", "python");
  const original = page.getByRole("tab", { name: "df (original)" });
  await expect(original).toBeVisible();
  await setCode(
    page,
    "df = df[df['status'] == 'completed'].assign(revenue=lambda d: d['qty'] * d['unit_price']).groupby('region', as_index=False)['revenue'].sum()",
  );
  await run(page);
  await expect(page.getByRole("tab", { name: "Your data" })).toBeVisible();
  await original.click();
  const pane = page.locator("#pane-original");
  await expect(pane).toContainText("order_id", { timeout: 20_000 });
  await expect(pane).toContainText("unit_price");
});

test("the answer note follows the language, and cleaning cases have none", async ({
  page,
}) => {
  await openCase(page, "the-twins", "w3-01-key-mirror", "python");
  const note = page.getByRole("region", { name: /Note: your answer goes in df/ });
  await expect(note).toBeVisible();
  await expect(note).toContainText("df = df.groupby");
  await page.goto("/");
  await openCase(page, "boss-fights", "w1-01-nul-sentinel", "sql");
  await expect(page.getByText(/^Note: /)).toHaveCount(0);
});
