import { describe, expect, it } from "vitest";
import {
  clampSplit,
  collageRows,
  collageRowTracks,
  columnShare,
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
  it("shares a row into two tables around a gutter", () => {
    expect(columnShare(0.4)).toBe("minmax(0, 0.4fr) 10px minmax(0, 0.6fr)");
  });

  it("splits the height only when there is more than one row", () => {
    expect(collageRowTracks(1, DEFAULT_SPLIT)).toBe("minmax(0, 1fr)");
    expect(collageRowTracks(2, { ...DEFAULT_SPLIT, row: 0.3 })).toContain("0.3fr");
  });

  it("lays out two stacked, three as 2 + 1, four as 2 + 2", () => {
    expect(collageRows(1)).toEqual([[0]]);
    expect(collageRows(2)).toEqual([[0], [1]]);
    expect(collageRows(3)).toEqual([[0, 1], [2]]);
    expect(collageRows(4)).toEqual([
      [0, 1],
      [2, 3],
    ]);
  });

  it("never lets a table shrink out of sight", () => {
    expect(clampSplit(0)).toBe(0.18);
    expect(clampSplit(1)).toBe(0.82);
    expect(clampSplit(0.4)).toBe(0.4);
  });
});
