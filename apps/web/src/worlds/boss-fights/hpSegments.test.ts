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

  it("normalizes the ratio against predicateCount, not just afflicted-cell count", () => {
    // 4 rows, 1 predicate hit per row out of 2 active predicates -> ratio 0.5 -> level 2
    const segments = computeHpSegments(4, kindsByRowOf([0, 1, 2, 3]), 2, 1, ["null"]);
    expect(segments[0]?.level).toBe(2);
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
