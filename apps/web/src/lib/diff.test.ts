import { describe, expect, it } from "vitest";
import { diffGrids } from "./diff";
import type { ResultGrid } from "@dcq/engine-adapters";

describe("diffGrids", () => {
  it("detects a single cell change", () => {
    const before: ResultGrid = {
      columns: ["email"],
      rows: [{ email: null }, { email: "a@b.com" }],
      dtypes: {},
      index: [0, 1],
    };
    const after: ResultGrid = {
      columns: ["email"],
      rows: [{ email: "unknown@example.com" }, { email: "a@b.com" }],
      dtypes: {},
      index: [0, 1],
    };

    expect(diffGrids(before, after)).toEqual([
      { rowIndex: 0, column: "email", before: null, after: "unknown@example.com" },
    ]);
  });

  it("returns no changes for identical grids", () => {
    const grid: ResultGrid = { columns: ["a"], rows: [{ a: 1 }], dtypes: {}, index: [0] };
    expect(diffGrids(grid, grid)).toEqual([]);
  });

  it("detects changes across multiple rows and columns, in row-major order", () => {
    const before: ResultGrid = {
      columns: ["a", "b"],
      rows: [
        { a: null, b: 1 },
        { a: 2, b: null },
      ],
      dtypes: {},
      index: [0, 1],
    };
    const after: ResultGrid = {
      columns: ["a", "b"],
      rows: [
        { a: 0, b: 1 },
        { a: 2, b: 0 },
      ],
      dtypes: {},
      index: [0, 1],
    };

    expect(diffGrids(before, after)).toEqual([
      { rowIndex: 0, column: "a", before: null, after: 0 },
      { rowIndex: 1, column: "b", before: null, after: 0 },
    ]);
  });

  it("matches rows by pandas index value, not array position", () => {
    // Row with index 5 sits at position 0 in `before` and position 1 in
    // `after` (something ahead of it in the original ordering got dropped).
    // A naive positional diff would compare the wrong rows; identity
    // matching finds the real (single) change.
    const before: ResultGrid = {
      columns: ["a"],
      rows: [{ a: 1 }, { a: 2 }],
      dtypes: {},
      index: [5, 9],
    };
    const after: ResultGrid = {
      columns: ["a"],
      rows: [{ a: 2 }, { a: 1 }],
      dtypes: {},
      index: [9, 5],
    };
    expect(diffGrids(before, after)).toEqual([]);
  });

  it("produces no spurious diffs when drop_duplicates()-style row removal shrinks the grid", () => {
    // pandas' default RangeIndex survives drop_duplicates() (keep="first")
    // unless .reset_index() is called — index 1 is simply gone from `after`,
    // and every retained row keeps its own original values.
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
    expect(diffGrids(before, after)).toEqual([]);
  });

  it("still flags a genuine value change on a row that also shifted position after a drop", () => {
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
      index: [0, 2],
    };
    expect(diffGrids(before, after)).toEqual([
      { rowIndex: 1, column: "email", before: null, after: "fixed@example.com" },
    ]);
  });

  it("skips a row with no counterpart in before rather than reporting spurious changes", () => {
    const before: ResultGrid = {
      columns: ["a"],
      rows: [{ a: 1 }],
      dtypes: {},
      index: [0],
    };
    const after: ResultGrid = {
      columns: ["a"],
      rows: [{ a: 1 }, { a: 2 }],
      dtypes: {},
      index: [0, 1],
    };
    expect(diffGrids(before, after)).toEqual([]);
  });

  it("documents current behavior on a colliding (non-unique) index value: last write wins", () => {
    // The worker's hidden row-id column (ADR 0006) is assigned fresh
    // 0..N-1 values and never duplicated in practice, but diffGrids itself
    // doesn't enforce uniqueness — if two "before" rows ever shared an
    // index value, the second silently overwrites the first in the lookup
    // rather than crashing. Documented, not (yet) a case that can occur.
    const before: ResultGrid = {
      columns: ["a"],
      rows: [{ a: 1 }, { a: 2 }],
      dtypes: {},
      index: [0, 0],
    };
    const after: ResultGrid = {
      columns: ["a"],
      rows: [{ a: 99 }],
      dtypes: {},
      index: [0],
    };
    expect(diffGrids(before, after)).toEqual([
      { rowIndex: 0, column: "a", before: 2, after: 99 },
    ]);
  });
});
