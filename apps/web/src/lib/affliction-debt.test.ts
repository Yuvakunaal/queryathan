import { describe, expect, it } from "vitest";
import type { ResultGrid } from "@dcq/engine-adapters";
import type { WinCondition } from "@dcq/content-schema";
import { predicateDebt, totalDebt } from "./affliction-cells";

const grid: ResultGrid = {
  columns: ["id", "name"],
  rows: [
    { id: 1, name: null },
    { id: 2, name: "B" },
  ],
  dtypes: {},
  index: [0, 1],
};

describe("predicateDebt / totalDebt", () => {
  it("counts afflicted cells, missing columns and a wrong row count", () => {
    const winCondition: WinCondition = {
      all: [
        { predicate: "no_nulls", column: "name" },
        { predicate: "has_columns", columns: ["name", "city", "tier"] },
        { predicate: "row_count", equals: 5 },
      ],
    };
    expect(winCondition.all.map((p) => predicateDebt(grid, p))).toEqual([1, 2, 1]);
    expect(totalDebt(grid, winCondition)).toBe(4);
  });

  it("is zero when everything is satisfied", () => {
    const winCondition: WinCondition = {
      all: [
        { predicate: "has_columns", columns: ["id"] },
        { predicate: "row_count", equals: 2 },
      ],
    };
    expect(totalDebt(grid, winCondition)).toBe(0);
  });
});
