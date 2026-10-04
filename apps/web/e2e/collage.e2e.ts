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

test("the line between two tables resizes them, double-click centres it, and it is remembered", async ({
  page,
}) => {
  await openCase(page, "the-twins", "w3-01-key-mirror", "sql");
  await page.waitForTimeout(1500);
  const handle = page.getByRole("separator", { name: "Height of the top table" });
  const before = await boxes(page);
  const h = await handle.boundingBox();
  if (!h) throw new Error("no handle");
  await page.mouse.move(h.x + h.width / 2, h.y + h.height / 2);
  await page.mouse.down();
  await page.mouse.move(h.x + h.width / 2, h.y + h.height / 2 + 120, { steps: 8 });
  await page.mouse.up();
  const after = await boxes(page);
  expect(after.main?.h ?? 0).toBeGreaterThan((before.main?.h ?? 0) + 90);
  expect(after.customers?.h ?? 0).toBeLessThan((before.customers?.h ?? 0) - 90);
  // Together they still fill the same room.
  expect((after.main?.h ?? 0) + (after.customers?.h ?? 0)).toBeCloseTo(
    (before.main?.h ?? 0) + (before.customers?.h ?? 0),
    0,
  );
  const saved = await page.evaluate(() =>
    window.localStorage.getItem("dcq.collage.w3-01-key-mirror.split"),
  );
  expect((JSON.parse(saved ?? "{}") as { row: number }).row).toBeGreaterThan(0.55);
  await handle.dblclick();
  const centred = await boxes(page);
  expect(centred.main?.h).toBeCloseTo(before.main?.h ?? 0, 0);
});

test("with four tables each row has its own vertical line, and the keyboard works", async ({
  page,
}) => {
  await openCase(page, "the-twins", "w3-06-four-corners", "sql");
  await page.waitForTimeout(1500);
  const before = await boxes(page);
  const upper = page.getByRole("separator", { name: "Width of the upper tables" });
  const lower = page.getByRole("separator", { name: "Width of the lower tables" });
  await upper.focus();
  for (let i = 0; i < 4; i += 1) await page.keyboard.press("ArrowRight");
  let after = await boxes(page);
  // The upper row's left table grew and its right table shrank by the same amount...
  expect(after.main?.w ?? 0).toBeGreaterThan((before.main?.w ?? 0) + 30);
  expect(after.customers?.w ?? 0).toBeLessThan((before.customers?.w ?? 0) - 30);
  expect((after.main?.w ?? 0) + (after.customers?.w ?? 0)).toBeCloseTo(
    (before.main?.w ?? 0) + (before.customers?.w ?? 0),
    0,
  );
  // ...while the lower row did not move at all.
  expect(after.products?.w ?? 0).toBeCloseTo(before.products?.w ?? 0, 0);
  expect(after.stores?.w ?? 0).toBeCloseTo(before.stores?.w ?? 0, 0);

  // The lower row can be set the other way round.
  await lower.focus();
  for (let i = 0; i < 4; i += 1) await page.keyboard.press("ArrowLeft");
  after = await boxes(page);
  expect(after.products?.w ?? 0).toBeLessThan((before.products?.w ?? 0) - 30);
  expect(after.stores?.w ?? 0).toBeGreaterThan((before.stores?.w ?? 0) + 30);
  expect(after.main?.w ?? 0).toBeGreaterThan((before.main?.w ?? 0) + 30); // the upper row kept its setting

  // They cannot be pushed out of sight, and Enter puts a line back in the middle.
  await upper.focus();
  await page.keyboard.press("End");
  expect((await boxes(page)).customers?.w ?? 0).toBeGreaterThan(100);
  await page.keyboard.press("Enter");
  expect((await boxes(page)).main?.w).toBeCloseTo(before.main?.w ?? 0, 0);
  const saved = await page.evaluate(() =>
    window.localStorage.getItem("dcq.collage.w3-06-four-corners.split"),
  );
  const parsed = JSON.parse(saved ?? "{}") as { col: number; col2: number };
  expect(parsed.col).toBeCloseTo(0.5, 2);
  expect(parsed.col2).toBeLessThan(0.45);
});

test("with four tables, 'Resize by column' gives each column its own horizontal line", async ({
  page,
}) => {
  await openCase(page, "the-twins", "w3-06-four-corners", "sql");
  await page.waitForTimeout(1500);
  await page.getByRole("button", { name: "Resize by column" }).click();
  const before = await boxes(page);
  const left = page.getByRole("separator", { name: "Height of the left tables" });
  const right = page.getByRole("separator", { name: "Height of the right tables" });
  await expect(left).toBeVisible();
  await expect(right).toBeVisible();

  // Dragging the left column's line changes only the left column's two tables.
  const h = await left.boundingBox();
  if (!h) throw new Error("no handle");
  await page.mouse.move(h.x + h.width / 2, h.y + h.height / 2);
  await page.mouse.down();
  await page.mouse.move(h.x + h.width / 2, h.y + h.height / 2 + 80, { steps: 8 });
  await page.mouse.up();
  let after = await boxes(page);
  expect(after.main?.h ?? 0).toBeGreaterThan((before.main?.h ?? 0) + 60);
  expect(after.products?.h ?? 0).toBeLessThan((before.products?.h ?? 0) - 60);
  expect(after.customers?.h ?? 0).toBeCloseTo(before.customers?.h ?? 0, 0);
  expect(after.stores?.h ?? 0).toBeCloseTo(before.stores?.h ?? 0, 0);

  // The right column goes the other way, on its own.
  await right.focus();
  for (let i = 0; i < 4; i += 1) await page.keyboard.press("ArrowUp");
  after = await boxes(page);
  expect(after.customers?.h ?? 0).toBeLessThan((before.customers?.h ?? 0) - 30);
  expect(after.stores?.h ?? 0).toBeGreaterThan((before.stores?.h ?? 0) + 30);
  expect(after.main?.h ?? 0).toBeGreaterThan((before.main?.h ?? 0) + 60); // the left kept its setting

  // One vertical line now divides both columns.
  const width = page.getByRole("separator", { name: "Width of the left tables" });
  await width.focus();
  for (let i = 0; i < 3; i += 1) await page.keyboard.press("ArrowRight");
  const wide = await boxes(page);
  expect(wide.main?.w ?? 0).toBeGreaterThan((before.main?.w ?? 0) + 20);
  expect(wide.products?.w ?? 0).toBeCloseTo(wide.main?.w ?? 0, 0);
  expect(wide.stores?.w ?? 0).toBeCloseTo(wide.customers?.w ?? 0, 0);

  // The choice is remembered, and the other way still works.
  await page.getByRole("button", { name: "Resize by row" }).click();
  await expect(
    page.getByRole("separator", { name: "Width of the upper tables" }),
  ).toBeVisible();
  expect(await page.evaluate(() => window.localStorage.getItem("dcq.collageMode"))).toBe(
    "rows",
  );
});
