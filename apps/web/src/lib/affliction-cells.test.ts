import { describe, expect, it } from "vitest";
import {
  afflictableColumns,
  afflictionCellMap,
  afflictionCountsByKind,
  afflictionKindAt,
  afflictionKindsByRow,
  clearedCells,
  countTotalAffliction,
  getAfflictedCells,
  predicateKindOrder,
} from "./affliction-cells";
import type { ResultGrid } from "@dcq/engine-adapters";
import type { WinCondition } from "@dcq/content-schema";

describe("getAfflictedCells", () => {
  it("maps no_nulls to kind 'null'", () => {
    const grid: ResultGrid = {
      columns: ["email"],
      rows: [{ email: null }, { email: "a@b.com" }],
      dtypes: {},
      index: [0, 1],
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
      index: [0, 1],
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
      index: [0],
    };
    expect(
      getAfflictedCells(whitespaceGrid, { predicate: "no_whitespace", column: "email" }),
    ).toEqual([{ rowIndex: 0, column: "email", kind: "ws" }]);

    const casingGrid: ResultGrid = {
      columns: ["email"],
      rows: [{ email: "A@B.com" }],
      dtypes: {},
      index: [0],
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
    const grid: ResultGrid = {
      columns: ["age"],
      rows: [{ age: 200 }],
      dtypes: {},
      index: [0],
    };
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
      index: [0],
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
      index: [0],
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
      index: [0],
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
      index: [0],
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
      index: [0],
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
      index: [0, 1],
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
      index: [0],
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

describe("clearedCells", () => {
  it("finds a simple fillna-style clear when row positions don't shift", () => {
    const winCondition: WinCondition = {
      all: [{ predicate: "no_nulls", column: "email" }],
    };
    const before: ResultGrid = {
      columns: ["email"],
      rows: [{ email: null }, { email: "a@b.com" }],
      dtypes: {},
      index: [0, 1],
    };
    const after: ResultGrid = {
      columns: ["email"],
      rows: [{ email: "fixed@example.com" }, { email: "a@b.com" }],
      dtypes: {},
      index: [0, 1],
    };
    const beforeMap = afflictionCellMap(before, winCondition);
    const afterMap = afflictionCellMap(after, winCondition);
    expect(clearedCells(before, beforeMap, after, afterMap)).toEqual([
      { rowIndex: 0, column: "email" },
    ]);
  });

  it("still finds the correct clear when a drop_duplicates()-style run shifts row positions", () => {
    const winCondition: WinCondition = {
      all: [{ predicate: "no_duplicates", columns: ["email"] }],
    };
    // index 1 is a duplicate of index 0; index 2 is unique. Dropping the
    // duplicate shifts index 2 from position 2 to position 1.
    const before: ResultGrid = {
      columns: ["email"],
      rows: [{ email: "a@b.com" }, { email: "a@b.com" }, { email: "c@d.com" }],
      dtypes: {},
      index: [0, 1, 2],
    };
    const after: ResultGrid = {
      columns: ["email"],
      rows: [{ email: "a@b.com" }, { email: "c@d.com" }],
      dtypes: {},
      index: [0, 2],
    };
    const beforeMap = afflictionCellMap(before, winCondition);
    const afterMap = afflictionCellMap(after, winCondition);
    // Only index 1 (the duplicate row) was ever afflicted, and it's gone —
    // nothing to mark "just cleared" on the surviving, merely-shifted rows.
    expect(clearedCells(before, beforeMap, after, afterMap)).toEqual([]);
  });

  it("finds a clear on a row that ALSO shifted position (exercises the after-position remap)", () => {
    // index 0 is a duplicate of index 1 and gets dropped, shifting index 2
    // from position 2 to position 1. Index 2's own email is null in
    // "before" and gets fixed in "after" — a real clear on a row whose
    // position changed for an unrelated reason (someone else's drop).
    const winCondition: WinCondition = {
      all: [
        { predicate: "no_nulls", column: "email" },
        { predicate: "no_duplicates", columns: ["email"] },
      ],
    };
    const before: ResultGrid = {
      columns: ["email"],
      rows: [{ email: "a@b.com" }, { email: "a@b.com" }, { email: null }],
      dtypes: {},
      index: [0, 1, 2],
    };
    const after: ResultGrid = {
      columns: ["email"],
      rows: [{ email: "a@b.com" }, { email: "fixed@example.com" }],
      dtypes: {},
      index: [1, 2],
    };
    const beforeMap = afflictionCellMap(before, winCondition);
    const afterMap = afflictionCellMap(after, winCondition);
    // Two real clears: index 1's duplicate flag lifts as a side effect of
    // its pair (index 0) being dropped (now at after-position 0), and
    // index 2's null is genuinely fixed (now at after-position 1) — the
    // one that also demonstrates the position shift the test is for.
    expect(
      clearedCells(before, beforeMap, after, afterMap).sort(
        (a, b) => a.rowIndex - b.rowIndex,
      ),
    ).toEqual([
      { rowIndex: 0, column: "email" },
      { rowIndex: 1, column: "email" },
    ]);
  });

  it("returns nothing when nothing was cleared", () => {
    const winCondition: WinCondition = {
      all: [{ predicate: "no_nulls", column: "email" }],
    };
    const grid: ResultGrid = {
      columns: ["email"],
      rows: [{ email: null }],
      dtypes: {},
      index: [0],
    };
    const map = afflictionCellMap(grid, winCondition);
    expect(clearedCells(grid, map, grid, map)).toEqual([]);
  });
});

describe("afflictableColumns", () => {
  it("counts a multi-column no_duplicates predicate as its full column span, not 1", () => {
    const winCondition: WinCondition = {
      all: [
        { predicate: "no_nulls", column: "email" },
        { predicate: "no_duplicates", columns: ["email", "item_sku", "submitted_at"] },
      ],
    };
    expect(afflictableColumns(winCondition).sort()).toEqual([
      "email",
      "item_sku",
      "submitted_at",
    ]);
  });

  it("deduplicates a column two predicates both target", () => {
    const winCondition: WinCondition = {
      all: [
        { predicate: "no_nulls", column: "age" },
        { predicate: "no_outliers", column: "age", min: 0, max: 120 },
      ],
    };
    expect(afflictableColumns(winCondition)).toEqual(["age"]);
  });

  it("matches THE_RECKONING's real shape: 7 predicates, 4 distinct columns", () => {
    const winCondition: WinCondition = {
      all: [
        { predicate: "no_nulls", column: "customer_email" },
        { predicate: "no_whitespace", column: "customer_email" },
        { predicate: "no_duplicates", columns: ["ticket_id"] },
        { predicate: "consistent_casing", column: "status", case: "lower" },
        { predicate: "valid_dtype", column: "first_response_hours", dtype: "float" },
        { predicate: "no_nulls", column: "first_response_hours" },
        { predicate: "no_outliers", column: "first_response_hours", min: 0, max: 336 },
      ],
    };
    expect(afflictableColumns(winCondition).sort()).toEqual([
      "customer_email",
      "first_response_hours",
      "status",
      "ticket_id",
    ]);
  });
});

describe("predicateKindOrder", () => {
  it("returns kinds in the order their predicates first appear", () => {
    const winCondition: WinCondition = {
      all: [
        { predicate: "no_outliers", column: "age", min: 0, max: 120 },
        { predicate: "no_nulls", column: "email" },
      ],
    };
    expect(predicateKindOrder(winCondition)).toEqual(["outlier", "null"]);
  });

  it("deduplicates repeated kinds (e.g. two no_nulls predicates on different columns)", () => {
    const winCondition: WinCondition = {
      all: [
        { predicate: "no_nulls", column: "email" },
        { predicate: "no_nulls", column: "phone" },
      ],
    };
    expect(predicateKindOrder(winCondition)).toEqual(["null"]);
  });

  it("collapses no_whitespace and consistent_casing into a single 'ws' entry", () => {
    const winCondition: WinCondition = {
      all: [
        { predicate: "no_whitespace", column: "email" },
        { predicate: "consistent_casing", column: "email", case: "lower" },
      ],
    };
    expect(predicateKindOrder(winCondition)).toEqual(["ws"]);
  });
});

describe("afflictionCountsByKind", () => {
  it("counts afflicted cells per kind", () => {
    const grid: ResultGrid = {
      columns: ["email"],
      rows: [{ email: null }, { email: null }, { email: " x@y.com" }],
      dtypes: {},
      index: [0, 1, 2],
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
