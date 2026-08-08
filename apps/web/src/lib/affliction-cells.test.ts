import { describe, expect, it } from "vitest";
import {
  afflictionCellMap,
  afflictionCountsByKind,
  afflictionKindAt,
  afflictionKindsByRow,
  countTotalAffliction,
  getAfflictedCells,
} from "./affliction-cells";
import type { ResultGrid } from "@dcq/engine-adapters";
import type { WinCondition } from "@dcq/content-schema";

describe("getAfflictedCells", () => {
  it("maps no_nulls to kind 'null'", () => {
    const grid: ResultGrid = {
      columns: ["email"],
      rows: [{ email: null }, { email: "a@b.com" }],
      dtypes: {},
    };
    expect(getAfflictedCells(grid, { predicate: "no_nulls", column: "email" })).toEqual([
      { rowIndex: 0, column: "email", kind: "null" },
    ]);
  });

  it("maps no_duplicates to kind 'dup' and flags every listed column on the flagged row", () => {
    const grid: ResultGrid = {
      columns: ["first", "last"],
      rows: [
        { first: "A", last: "B" },
        { first: "A", last: "B" },
      ],
      dtypes: {},
    };
    expect(
      getAfflictedCells(grid, { predicate: "no_duplicates", columns: ["first", "last"] }),
    ).toEqual([
      { rowIndex: 1, column: "first", kind: "dup" },
      { rowIndex: 1, column: "last", kind: "dup" },
    ]);
  });

  it("maps both no_whitespace and consistent_casing to kind 'ws'", () => {
    const whitespaceGrid: ResultGrid = {
      columns: ["email"],
      rows: [{ email: " a@b.com" }],
      dtypes: {},
    };
    expect(
      getAfflictedCells(whitespaceGrid, { predicate: "no_whitespace", column: "email" }),
    ).toEqual([{ rowIndex: 0, column: "email", kind: "ws" }]);

    const casingGrid: ResultGrid = {
      columns: ["email"],
      rows: [{ email: "A@B.com" }],
      dtypes: {},
    };
    expect(
      getAfflictedCells(casingGrid, {
        predicate: "consistent_casing",
        column: "email",
        case: "lower",
      }),
    ).toEqual([{ rowIndex: 0, column: "email", kind: "ws" }]);
  });

  it("maps no_outliers to kind 'outlier'", () => {
    const grid: ResultGrid = { columns: ["age"], rows: [{ age: 200 }], dtypes: {} };
    expect(
      getAfflictedCells(grid, {
        predicate: "no_outliers",
        column: "age",
        min: 0,
        max: 120,
      }),
    ).toEqual([{ rowIndex: 0, column: "age", kind: "outlier" }]);
  });

  it("maps valid_dtype to kind 'dtype' for non-datetime targets", () => {
    const grid: ResultGrid = {
      columns: ["age"],
      rows: [{ age: "30" }],
      dtypes: { age: "object" },
    };
    expect(
      getAfflictedCells(grid, { predicate: "valid_dtype", column: "age", dtype: "int" }),
    ).toEqual([{ rowIndex: 0, column: "age", kind: "dtype" }]);
  });

  it("maps valid_dtype to kind 'date' for a datetime target", () => {
    const grid: ResultGrid = {
      columns: ["opened_at"],
      rows: [{ opened_at: "2026-01-01" }],
      dtypes: { opened_at: "object" },
    };
    expect(
      getAfflictedCells(grid, {
        predicate: "valid_dtype",
        column: "opened_at",
        dtype: "datetime",
      }),
    ).toEqual([{ rowIndex: 0, column: "opened_at", kind: "date" }]);
  });
});

describe("afflictionCellMap", () => {
  it("gives the first predicate in winCondition.all priority when two claim the same cell", () => {
    const grid: ResultGrid = {
      columns: ["age"],
      rows: [{ age: null }],
      dtypes: { age: "object" },
    };
    const winCondition: WinCondition = {
      all: [
        { predicate: "no_nulls", column: "age" },
        { predicate: "valid_dtype", column: "age", dtype: "int" },
      ],
    };
    const map = afflictionCellMap(grid, winCondition);
    expect(afflictionKindAt(map, 0, "age")).toBe("null");
  });

  it("combines cells from multiple predicates across different columns", () => {
    const grid: ResultGrid = {
      columns: ["email", "age"],
      rows: [{ email: null, age: 200 }],
      dtypes: {},
    };
    const winCondition: WinCondition = {
      all: [
        { predicate: "no_nulls", column: "email" },
        { predicate: "no_outliers", column: "age", min: 0, max: 120 },
      ],
    };
    const map = afflictionCellMap(grid, winCondition);
    expect(afflictionKindAt(map, 0, "email")).toBe("null");
    expect(afflictionKindAt(map, 0, "age")).toBe("outlier");
    expect(map.size).toBe(2);
  });

  it("returns undefined for a clean cell", () => {
    const grid: ResultGrid = {
      columns: ["email"],
      rows: [{ email: "a@b.com" }],
      dtypes: {},
    };
    const winCondition: WinCondition = {
      all: [{ predicate: "no_nulls", column: "email" }],
    };
    const map = afflictionCellMap(grid, winCondition);
    expect(afflictionKindAt(map, 0, "email")).toBeUndefined();
  });
});

describe("countTotalAffliction", () => {
  it("sums afflicted cells across every predicate", () => {
    const grid: ResultGrid = {
      columns: ["email", "age"],
      rows: [
        { email: null, age: 30 },
        { email: "a@b.com", age: 200 },
      ],
      dtypes: {},
    };
    const winCondition: WinCondition = {
      all: [
        { predicate: "no_nulls", column: "email" },
        { predicate: "no_outliers", column: "age", min: 0, max: 120 },
      ],
    };
    expect(countTotalAffliction(grid, winCondition)).toBe(2);
  });
});

describe("afflictionKindsByRow", () => {
  it("groups afflicted cells by row across columns", () => {
    const grid: ResultGrid = {
      columns: ["email", "age"],
      rows: [{ email: null, age: 200 }],
      dtypes: {},
    };
    const winCondition: WinCondition = {
      all: [
        { predicate: "no_nulls", column: "email" },
        { predicate: "no_outliers", column: "age", min: 0, max: 120 },
      ],
    };
    const map = afflictionCellMap(grid, winCondition);
    const byRow = afflictionKindsByRow(map);
    expect(byRow.get(0)?.sort()).toEqual(["null", "outlier"]);
  });
});

describe("afflictionCountsByKind", () => {
  it("counts afflicted cells per kind", () => {
    const grid: ResultGrid = {
      columns: ["email"],
      rows: [{ email: null }, { email: null }, { email: " x@y.com" }],
      dtypes: {},
    };
    const winCondition: WinCondition = {
      all: [
        { predicate: "no_nulls", column: "email" },
        { predicate: "no_whitespace", column: "email" },
      ],
    };
    const map = afflictionCellMap(grid, winCondition);
    const counts = afflictionCountsByKind(map);
    expect(counts.get("null")).toBe(2);
    expect(counts.get("ws")).toBe(1);
  });
});
