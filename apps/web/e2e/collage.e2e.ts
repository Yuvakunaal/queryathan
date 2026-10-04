import { expect, test } from "./fixtures";
import type { Page } from "@playwright/test";
import { openCase } from "./helpers";

const CASES = [
  ["w3-01-key-mirror", 2, "stacked"],
  ["w3-05-three-way", 3, "two on top, one below"],
  ["w3-06-four-corners", 4, "four squares"],
] as const;

async function boxes(
  page: Page,
): Promise<Record<string, { x: number; y: number; w: number; h: number }>> {
  return page.evaluate(() => {
    const out: Record<string, { x: number; y: number; w: number; h: number }> = {};
    document.querySelectorAll<HTMLElement>("[data-collage-pane]").forEach((el) => {
      const r = el.getBoundingClientRect();
      out[el.dataset.collagePane ?? ""] = { x: r.x, y: r.y, w: r.width, h: r.height };
    });
    return out;
  });
}

for (const [caseId, count, shape] of CASES) {
  test(`${caseId}: ${String(count)} tables form a ${shape} collage`, async ({ page }) => {
    await openCase(page, "the-twins", caseId, "sql");
    const panes = page.locator("[data-collage-pane]");
    await expect(panes).toHaveCount(count);
    const b = Object.values(await boxes(page));
    expect(b.every((p) => p.w > 120 && p.h > 60)).toBe(true);
    const sameRow = (i: number, j: number): boolean =>
      Math.abs((b[i]?.y ?? 0) - (b[j]?.y ?? 1)) < 4;
    if (count === 2) {
      expect(sameRow(0, 1)).toBe(false); // one above the other
      expect(Math.abs((b[0]?.x ?? 0) - (b[1]?.x ?? 1))).toBeLessThan(4);
    } else if (count === 3) {
      expect(sameRow(0, 1)).toBe(true); // two on top
      expect(sameRow(0, 2)).toBe(false); // one below
      expect(b[2]?.w ?? 0).toBeGreaterThan((b[0]?.w ?? 0) * 1.8); // spanning the bottom
    } else {
      expect(sameRow(0, 1)).toBe(true);
      expect(sameRow(2, 3)).toBe(true);
      expect(sameRow(0, 2)).toBe(false);
    }
    await expect(
      page.getByRole("group", { name: "How to show the tables" }),
    ).toContainText(`${String(count)} tables`);
  });
}

test("a table can be dragged onto another to swap places, and the order is remembered", async ({
  page,
}) => {
  await openCase(page, "the-twins", "w3-06-four-corners", "sql");
  await page.waitForTimeout(1500); // let the entrance animation settle
  const before = await boxes(page);
  const grip = page.getByRole("button", { name: /^Move stores\./ });
  const target = page.locator('[data-collage-pane="main"]');
  const g = await grip.boundingBox();
  const t = await target.boundingBox();
  if (!g || !t) throw new Error("no boxes");
  await page.mouse.move(g.x + g.width / 2, g.y + g.height / 2);
  await page.mouse.down();
  await page.mouse.move(t.x + t.width / 2, t.y + t.height / 2, { steps: 8 });
  await page.mouse.up();
  const after = await boxes(page);
  expect(after.stores?.x).toBeCloseTo(before.main?.x ?? 0, 0);
  expect(after.stores?.y).toBeCloseTo(before.main?.y ?? 0, 0);
  expect(after.main?.x).toBeCloseTo(before.stores?.x ?? 0, 0);
  // The order is saved for next time.
  const saved = await page.evaluate(() =>
    window.localStorage.getItem("dcq.collage.w3-06-four-corners"),
  );
  expect(JSON.parse(saved ?? "[]")).toEqual(["stores", "customers", "products", "main"]);
});

test("the arrow keys move a table too, and One at a time brings back the tabs", async ({
  page,
}) => {
  await openCase(page, "the-twins", "w3-05-three-way", "sql");
  await page.waitForTimeout(1500);
  const before = await boxes(page);
  const grip = page.getByRole("button", { name: /^Move customers\./ });
  await grip.focus();
  await page.keyboard.press("ArrowLeft");
  const after = await boxes(page);
  expect(after.customers?.x).toBeCloseTo(before.main?.x ?? 0, 0);
  await expect(page.getByText(/customers moved to position 1 of 3/)).toBeAttached();

  await page.getByRole("button", { name: "One at a time" }).click();
  await expect(page.locator("[data-collage-pane]")).toHaveCount(0);
  await expect(page.getByRole("tab", { name: "customers (original)" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "products (original)" })).toBeVisible();
  await page.getByRole("button", { name: "Collage" }).click();
  await expect(page.locator("[data-collage-pane]")).toHaveCount(3);
  await expect(page.getByRole("tab", { name: "customers (original)" })).toHaveCount(0);
});
