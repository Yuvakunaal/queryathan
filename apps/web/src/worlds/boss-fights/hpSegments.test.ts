import { describe, expect, it } from "vitest";
import { computeHpSegments } from "./hpSegments";
import type { ResultGrid } from "@dcq/engine-adapters";

function gridOf(values: (number | null)[]): ResultGrid {
  return { columns: ["temp_c"], rows: values.map((v) => ({ temp_c: v })) };
}

describe("computeHpSegments", () => {
  it("caps segment count at maxSegments while covering every row", () => {
    const grid = gridOf(Array.from({ length: 240 }, () => 1));
    const segments = computeHpSegments(grid, "temp_c", 200);
    expect(segments).toHaveLength(200);
    expect(segments.reduce((sum, s) => sum + s.rowCount, 0)).toBe(240);
  });

  it("uses one segment per row when rowCount is below the cap", () => {
    const grid = gridOf([1, null, 1, null]);
    const segments = computeHpSegments(grid, "temp_c", 200);
    expect(segments).toHaveLength(4);
    expect(segments.map((s) => s.level)).toEqual([0, 3, 0, 3]);
  });

  it("assigns level 0 for a fully clean segment and level 3 for fully afflicted", () => {
    const grid = gridOf([1, 1, null, null]);
    const segments = computeHpSegments(grid, "temp_c", 2);
    expect(segments[0]?.level).toBe(0);
    expect(segments[1]?.level).toBe(3);
  });

  it("assigns intermediate levels by affliction ratio within a bin", () => {
    // bin of 4: 1/4 afflicted -> level 1, 3/4 afflicted -> level 3
    const gridLow = gridOf([null, 1, 1, 1]);
    expect(computeHpSegments(gridLow, "temp_c", 1)[0]?.level).toBe(1);

    const gridMid = gridOf([null, null, 1, 1]);
    expect(computeHpSegments(gridMid, "temp_c", 1)[0]?.level).toBe(2);

    const gridHigh = gridOf([null, null, null, 1]);
    expect(computeHpSegments(gridHigh, "temp_c", 1)[0]?.level).toBe(3);
  });
});
