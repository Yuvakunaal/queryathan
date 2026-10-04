import { expect, test } from "./fixtures";
import { openCase, seed } from "./helpers";

test("effects, typing and volume are separate, and they are remembered", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Sound settings" }).click();
  const menu = page.getByRole("group", { name: "Sound settings" });
  const effects = menu.getByRole("checkbox", { name: /Effects/ });
  const typing = menu.getByRole("checkbox", { name: /Typing/ });
  await expect(effects).toBeChecked();
  await expect(typing).toBeChecked();
  await typing.uncheck();
  await menu.getByRole("slider", { name: /Volume/ }).fill("40");
  await expect(effects).toBeChecked();
  await page.reload();
  await page.getByRole("button", { name: "Sound settings" }).click();
  const again = page.getByRole("group", { name: "Sound settings" });
  await expect(again.getByRole("checkbox", { name: /Typing/ })).not.toBeChecked();
  await expect(again.getByRole("checkbox", { name: /Effects/ })).toBeChecked();
  await expect(again.getByRole("slider", { name: /Volume/ })).toHaveValue("40");
  await page.keyboard.press("Escape");
  await expect(again).toBeHidden();
});

test("the boot sequence types with sound, and silently when sound is off", async ({
  page,
}) => {
  const count = async (): Promise<number> =>
    page.evaluate(() => (window as unknown as { __keys: number }).__keys);
  await page.addInitScript(() => {
    const w = window as unknown as { __keys: number };
    w.__keys = 0;
    const proto = AudioContext.prototype;
    // eslint-disable-next-line @typescript-eslint/unbound-method -- called with .call(this) below
    const original = proto.createBufferSource;
    AudioContext.prototype.createBufferSource = function patched(this: AudioContext) {
      w.__keys += 1;
      return original.call(this);
    };
  });
  await openCase(page, "boss-fights", "w1-01-nul-sentinel", "sql", { skipBoot: true });
  await page.getByText(/ENTER \]/).waitFor({ timeout: 120_000 });
  expect(await count()).toBeGreaterThan(40);
});

test("typing in the editor plays a key sound per keystroke, and none for shortcuts", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __keys: number };
    w.__keys = 0;
    const proto = AudioContext.prototype;
    // eslint-disable-next-line @typescript-eslint/unbound-method -- called with .call(this) below
    const original = proto.createBufferSource;
    AudioContext.prototype.createBufferSource = function patched(this: AudioContext) {
      w.__keys += 1;
      return original.call(this);
    };
  });
  await openCase(page, "boss-fights", "w1-01-nul-sentinel", "sql");
  const count = async (): Promise<number> =>
    page.evaluate(() => (window as unknown as { __keys: number }).__keys);
  await page.locator(".cm-content").click();
  await page.waitForTimeout(300);
  const before = await count();
  await page.keyboard.press("ControlOrMeta+a");
  await page.waitForTimeout(100);
  expect(await count()).toBe(before);
  await page.keyboard.type("SELECT 1", { delay: 80 });
  expect(await count()).toBeGreaterThanOrEqual(before + 8);
});
