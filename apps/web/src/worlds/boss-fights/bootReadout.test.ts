import { describe, expect, it } from "vitest";
import type { ResultGrid } from "@dcq/engine-adapters";
import { bootReadout } from "./bootReadout";

const grid: ResultGrid = {
  columns: ["a", "b"],
  rows: [
    { a: 1, b: null },
    { a: 2, b: 3 },
  ],
  dtypes: {},
  index: [0, 1],
};

describe("bootReadout", () => {
  it("counts cells for cell rules and leaves the default readout alone", () => {
    const r = bootReadout(
      grid,
      { all: [{ predicate: "no_nulls", column: "b" }] },
      "boss-fights",
    );
    expect(r).toEqual({ scanLabel: "NUL", detected: undefined });
  });

  it("counts checks, not cells, for whole-table rules", () => {
    const r = bootReadout(
      grid,
      {
        all: [
          { predicate: "row_count", equals: 5 },
          { predicate: "has_columns", columns: ["z"] },
        ],
      },
      "the-twins",
    );
    expect(r.scanLabel).toBe("LINK");
    expect(r.detected).toBe("002 CHECKS  TO PASS");
  });

  it("mixes both when a case has both", () => {
    const r = bootReadout(
      grid,
      {
        all: [
          { predicate: "no_nulls", column: "b" },
          { predicate: "row_count", equals: 9 },
        ],
      },
      "the-twins",
    );
    expect(r.scanLabel).toBe("NUL+LINK");
    expect(r.detected).toBe("001 CELLS  001 CHECK");
  });
});
