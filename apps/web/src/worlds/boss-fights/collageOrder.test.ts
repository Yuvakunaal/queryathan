import { describe, expect, it } from "vitest";
import {
  clampSplit,
  collagePlacement,
  collageTracks,
  DEFAULT_SPLIT,
  orderPanes,
  swapOrder,
} from "./collageOrder";

const panes = [{ id: "main" }, { id: "customers" }, { id: "products" }];

describe("collage order", () => {
  it("follows the saved order and puts new tables last", () => {
    expect(orderPanes(panes, ["products", "main"]).map((p) => p.id)).toEqual([
      "products",
      "main",
      "customers",
    ]);
  });

  it("ignores saved ids that no longer exist", () => {
    expect(orderPanes(panes, ["gone", "customers"]).map((p) => p.id)).toEqual([
      "customers",
      "main",
      "products",
    ]);
  });

  it("swaps two tables and leaves an unknown id alone", () => {
    expect(swapOrder(["a", "b", "c"], "a", "c")).toEqual(["c", "b", "a"]);
    expect(swapOrder(["a", "b"], "a", "zzz")).toEqual(["a", "b"]);
  });
});

describe("collage layout", () => {
  it("shares the room into tracks around a gutter", () => {
    expect(collageTracks(1, DEFAULT_SPLIT)).toEqual({
      columns: "minmax(0, 1fr)",
      rows: "minmax(0, 1fr)",
    });
    expect(collageTracks(2, { col: 0.5, row: 0.3 }).rows).toContain("0.3fr");
    expect(collageTracks(2, { col: 0.5, row: 0.3 }).columns).toBe("minmax(0, 1fr)");
    expect(collageTracks(4, { col: 0.4, row: 0.5 }).columns).toBe(
      "minmax(0, 0.4fr) 10px minmax(0, 0.6fr)",
    );
  });

  it("places two stacked, three as 2 + 1, four as a 2 by 2", () => {
    expect([0, 1].map((i) => collagePlacement(2, i).row)).toEqual(["1", "3"]);
    expect([0, 1, 2].map((i) => collagePlacement(3, i))).toEqual([
      { column: "1", row: "1" },
      { column: "3", row: "1" },
      { column: "1 / -1", row: "3" },
    ]);
    expect([0, 1, 2, 3].map((i) => collagePlacement(4, i))).toEqual([
      { column: "1", row: "1" },
      { column: "3", row: "1" },
      { column: "1", row: "3" },
      { column: "3", row: "3" },
    ]);
  });

  it("never lets a table shrink out of sight", () => {
    expect(clampSplit(0)).toBe(0.18);
    expect(clampSplit(1)).toBe(0.82);
    expect(clampSplit(0.4)).toBe(0.4);
  });
});
