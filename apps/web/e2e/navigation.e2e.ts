import { expect, test } from "./fixtures";
import { openCase, run, seed, setCode } from "./helpers";

test("the browser's Back and Forward buttons move between screens", async ({ page }) => {
  await seed(page);
  await page.goto("/");
  await page.locator('[data-world-card="the-vault"]').click();
  await expect(page.getByRole("heading", { name: "Cryptara" })).toBeVisible();
  expect(page.url()).toContain("#/world/the-vault");
  await expect(page).toHaveTitle(/Cryptara/);
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: /Fight your data clean/ }),
  ).toBeVisible();
  await expect(page).toHaveTitle("Queryathan");
  await page.goForward();
  await expect(page.getByRole("heading", { name: "Cryptara" })).toBeVisible();
});

test("a roster address opens that world, and a bad address opens home", async ({
  page,
}) => {
  await page.goto("/#/world/the-twins");
  await expect(page.getByRole("heading", { name: "Geminora" })).toBeVisible();
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
  await expect(page.getByRole("heading", { name: "Ember Reach" })).toBeVisible();
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

test("in Python the original table stays on its own tab while df becomes the answer", async ({
  page,
}) => {
  await openCase(page, "the-observatory", "w6-01-first-light", "python");
  const original = page.getByRole("tab", { name: "Data (original)" });
  const answer = page.getByRole("tab", { name: "Your answer (df)" });
  await expect(original).toBeVisible();
  await expect(answer).toBeVisible();
  await setCode(
    page,
    "df = df[df['status'] == 'completed'].assign(revenue=lambda d: d['qty'] * d['unit_price']).groupby('region', as_index=False)['revenue'].sum()",
  );
  await run(page);
  // The run takes you to the answer...
  await expect(answer).toHaveAttribute("aria-selected", "true", { timeout: 30_000 });
  await expect(page.locator("#pane-answer")).toContainText("revenue");
  await expect(page.locator("#pane-answer")).toContainText("3789.15");
  // ...and the original table is untouched on its own tab.
  await original.click();
  const pane = page.locator("#pane-data");
  await expect(pane).toContainText("order_id");
  await expect(pane).toContainText("unit_price");
  await expect(pane).not.toContainText("revenue");
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
