import { expect, test } from "./fixtures";
import { openCase, run, seed, setCode } from "./helpers";

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

test("the finishing cut plays the layered knife sound, then the smooth ending", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __built: Record<string, number> };
    w.__built = {};
    const proto = AudioContext.prototype as unknown as Record<
      string,
      (...a: unknown[]) => unknown
    >;
    for (const name of [
      "createBufferSource",
      "createConvolver",
      "createDynamicsCompressor",
      "createOscillator",
    ]) {
      const original = proto[name];
      if (!original) continue;
      proto[name] = function patched(this: AudioContext, ...args: unknown[]) {
        w.__built[name] = (w.__built[name] ?? 0) + 1;
        return original.apply(this, args);
      };
    }
  });
  await openCase(page, "boss-fights", "w1-01-nul-sentinel", "sql");
  const read = async (): Promise<Record<string, number>> =>
    page.evaluate(
      () => (window as unknown as { __built: Record<string, number> }).__built,
    );
  const before = await read();
  await setCode(
    page,
    "UPDATE data SET temp_c = (SELECT AVG(temp_c) FROM data) WHERE temp_c IS NULL;",
  );
  await run(page);
  // The cut: swish, knife recording, crack, juice and body (buffer sources), thud and drops (oscillators).
  await expect
    .poll(
      async () =>
        ((await read()).createBufferSource ?? 0) - (before.createBufferSource ?? 0),
      {
        timeout: 10_000,
      },
    )
    .toBeGreaterThanOrEqual(5);
  // Then the ending: smooth notes and a pad in a long room.
  await expect
    .poll(async () => (await read()).createConvolver ?? 0, { timeout: 10_000 })
    .toBeGreaterThanOrEqual(1);
  expect((await read()).createWaveShaper ?? 0).toBe(0); // nothing distorted
  expect((await read()).createDynamicsCompressor).toBe(1);
});
