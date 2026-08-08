import { describe, expect, it } from "vitest";
import { computeHpSegments } from "./hpSegments";
import type { AfflictionKind } from "../../lib/affliction-cells";

function kindsByRowOf(
  afflictedRowIndices: number[],
  kind: AfflictionKind = "null",
): Map<number, AfflictionKind[]> {
  const map = new Map<number, AfflictionKind[]>();
  for (const rowIndex of afflictedRowIndices) map.set(rowIndex, [kind]);
  return map;
}

describe("computeHpSegments", () => {
  it("caps segment count at maxSegments while covering every row", () => {
    const segments = computeHpSegments(240, new Map(), 1, 200, ["null"]);
    expect(segments).toHaveLength(200);
    expect(segments.reduce((sum, s) => sum + s.rowCount, 0)).toBe(240);
  });

  it("uses one segment per row when rowCount is below the cap", () => {
    const segments = computeHpSegments(4, kindsByRowOf([1, 3]), 1, 200, ["null"]);
    expect(segments).toHaveLength(4);
    expect(segments.map((s) => s.level)).toEqual([0, 3, 0, 3]);
  });

  it("assigns level 0 for a fully clean segment and level 3 for fully afflicted", () => {
    const segments = computeHpSegments(4, kindsByRowOf([2, 3]), 1, 2, ["null"]);
    expect(segments[0]?.level).toBe(0);
    expect(segments[1]?.level).toBe(3);
  });

  it("assigns intermediate levels by affliction ratio within a bin", () => {
    // bin of 4: 1/4 afflicted -> level 1, 2/4 -> level 2, 3/4 -> level 3
    expect(computeHpSegments(4, kindsByRowOf([0]), 1, 1, ["null"])[0]?.level).toBe(1);
    expect(computeHpSegments(4, kindsByRowOf([0, 1]), 1, 1, ["null"])[0]?.level).toBe(2);
    expect(computeHpSegments(4, kindsByRowOf([0, 1, 2]), 1, 1, ["null"])[0]?.level).toBe(
      3,
    );
  });

  it("treats an exact 1/3 ratio as level 1, not level 2 (regression: 0.33 decimal literal rounded this wrong)", () => {
    // 1 afflicted column out of 3 capacity, every row — CASE_SHIFT's exact
    // baseline shape before the player has typed anything.
    const segments = computeHpSegments(3, kindsByRowOf([0, 1, 2]), 3, 1, ["null"]);
    expect(segments[0]?.level).toBe(1);
  });

  it("treats an exact 2/3 ratio as level 2, not level 3", () => {
    const kindsByRow = new Map<number, AfflictionKind[]>([
      [0, ["null", "ws"]],
      [1, ["null", "ws"]],
      [2, ["null", "ws"]],
    ]);
    const segments = computeHpSegments(3, kindsByRow, 3, 1, ["null"]);
    expect(segments[0]?.level).toBe(2);
  });

  it("normalizes against column capacity, not predicate count — a multi-column no_duplicates predicate needs its full column span as capacity", () => {
    // Mirrors DOUBLE_TAKE's shape: 1 predicate (no_nulls) contributes 1
    // column, another (no_duplicates) spans 3 columns -> capacity 4, not
    // "2 predicates". A row afflicted on all 4 columns should hit level 3,
    // not be diluted by counting predicates instead of columns.
    const kindsByRow = new Map<number, AfflictionKind[]>([
      [0, ["null", "dup", "dup", "dup"]],
    ]);
    const segments = computeHpSegments(1, kindsByRow, 4, 1, ["null", "dup"]);
    expect(segments[0]?.level).toBe(3);
  });

  it("reaches level 3 on a THE_RECKONING-shaped win condition (4 afflictable columns, 7 predicates) — regression for the unreachable-top-tier bug", () => {
    // The bug: normalizing against predicateCount (7) instead of column
    // capacity (4) made the max achievable ratio 4/7 ≈ 0.57, capping every
    // segment at level 2 regardless of how afflicted a row actually was.
    const kindsByRow = new Map<number, AfflictionKind[]>([
      [0, ["null", "ws", "dup", "dtype"]],
    ]);
    const segments = computeHpSegments(1, kindsByRow, 4, 1, [
      "null",
      "ws",
      "dup",
      "dtype",
    ]);
    expect(segments[0]?.level).toBe(3);
  });

  it("picks the dominant kind by cell count within a bin", () => {
    const kindsByRow = new Map<number, AfflictionKind[]>([
      [0, ["null"]],
      [1, ["ws"]],
      [2, ["ws"]],
    ]);
    const segments = computeHpSegments(3, kindsByRow, 1, 1, ["null", "ws"]);
    expect(segments[0]?.dominantKind).toBe("ws");
  });

  it("breaks a dominant-kind tie using kindOrder", () => {
    const kindsByRow = new Map<number, AfflictionKind[]>([
      [0, ["null"]],
      [1, ["ws"]],
    ]);
    const segments = computeHpSegments(2, kindsByRow, 1, 1, ["ws", "null"]);
    expect(segments[0]?.dominantKind).toBe("ws");
  });

  it("returns a null dominantKind for a clean bin", () => {
    const segments = computeHpSegments(4, new Map(), 1, 1, ["null"]);
    expect(segments[0]?.dominantKind).toBeNull();
  });
});
