import { describe, expect, it } from "vitest";
import { diffGrids } from "./diff";
import type { ResultGrid } from "@dcq/engine-adapters";

describe("diffGrids", () => {
  it("detects a single cell change", () => {
    const before: ResultGrid = {
      columns: ["email"],
      rows: [{ email: null }, { email: "a@b.com" }],
    };
    const after: ResultGrid = {
      columns: ["email"],
      rows: [{ email: "unknown@example.com" }, { email: "a@b.com" }],
    };

    expect(diffGrids(before, after)).toEqual([
      { rowIndex: 0, column: "email", before: null, after: "unknown@example.com" },
    ]);
  });

  it("returns no changes for identical grids", () => {
    const grid: ResultGrid = { columns: ["a"], rows: [{ a: 1 }] };
    expect(diffGrids(grid, grid)).toEqual([]);
  });

  it("detects changes across multiple rows and columns, in row-major order", () => {
    const before: ResultGrid = {
      columns: ["a", "b"],
      rows: [
        { a: null, b: 1 },
        { a: 2, b: null },
      ],
    };
    const after: ResultGrid = {
      columns: ["a", "b"],
      rows: [
        { a: 0, b: 1 },
        { a: 2, b: 0 },
      ],
    };

    expect(diffGrids(before, after)).toEqual([
      { rowIndex: 0, column: "a", before: null, after: 0 },
      { rowIndex: 1, column: "b", before: null, after: 0 },
    ]);
  });

  it("only compares up to the shorter grid's row count", () => {
    const before: ResultGrid = { columns: ["a"], rows: [{ a: 1 }, { a: 2 }] };
    const after: ResultGrid = { columns: ["a"], rows: [{ a: 1 }] };
    expect(diffGrids(before, after)).toEqual([]);
  });
});
