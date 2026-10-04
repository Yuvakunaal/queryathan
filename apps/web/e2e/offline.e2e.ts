import { test, expect } from "./fixtures";
import { openCase, run, setCode } from "./helpers";

test("after one visit the app keeps working with no connection", async ({
  page,
  context,
}) => {
  test.setTimeout(240_000);
  await openCase(page, "boss-fights", "w1-01-nul-sentinel", "python");

  // The worker registers after load and takes control of the page.
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await setCode(page, "len(df)");
  await run(page);
  await expect(page.locator("#pane-result")).toContainText("240");

  // Everything the Python engine needs has now been fetched through the worker.
  // Give it a moment to finish writing the cache.
  await page.waitForTimeout(2000);
  await page.reload();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
    .toBe(true);

  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: /Fight your data clean/ }),
  ).toBeVisible();

  await page.locator('[data-world-card="boss-fights"]').click();
  await page.getByRole("button", { name: /^NUL_SENTINEL,/ }).click();
  await page.getByText("PYTHON", { exact: true }).click();
  await page.getByText(/ENTER \]/).waitFor({ timeout: 120_000 });
  await page.waitForTimeout(700);
  await page.getByText(/ENTER \]/).click();
  await page.locator(".cm-content").waitFor();
  await setCode(page, "df['temp_c'].isna().sum()");
  await run(page);
  await expect(page.locator("#pane-result")).toContainText("23");
});

test("the service worker only claims this app's own files", async ({ page }) => {
  await page.goto("/");
  const scope = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    return registration.scope;
  });
  expect(scope).toBe("http://localhost:4173/");
});
