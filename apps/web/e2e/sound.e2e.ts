import { expect, test } from "./fixtures";
import { seed } from "./helpers";

test("the sound toggle starts off and remembers its state", async ({ page }) => {
  await seed(page);
  await page.goto("/");
  const sound = page.getByRole("button", { name: "Sound effects" });
  await expect(sound).toHaveAttribute("aria-pressed", "false");
  await sound.click();
  await expect(sound).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(page.getByRole("button", { name: "Sound effects" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});
