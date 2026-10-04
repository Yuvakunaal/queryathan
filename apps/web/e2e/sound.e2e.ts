import { expect, test } from "./fixtures";
import { openCase, seed } from "./helpers";

test("the sound toggle starts on and remembers its state", async ({ page }) => {
  await seed(page);
  await page.goto("/");
  const sound = page.getByRole("button", { name: "Sound effects" });
  await expect(sound).toHaveAttribute("aria-pressed", "true");
  await sound.click();
  await expect(sound).toHaveAttribute("aria-pressed", "false");
  await page.reload();
  await expect(page.getByRole("button", { name: "Sound effects" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
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
