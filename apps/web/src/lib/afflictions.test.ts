import { describe, expect, it } from "vitest";
import { countDuplicates, countNulls } from "./afflictions";
import type { ResultGrid } from "@dcq/engine-adapters";

describe("countNulls", () => {
  it("counts null values in the given column", () => {
    const grid: ResultGrid = {
      columns: ["email"],
      rows: [{ email: null }, { email: "a@b.com" }, { email: null }],
    };
    expect(countNulls(grid, "email")).toBe(2);
  });

  it("returns 0 when there are no nulls", () => {
    const grid: ResultGrid = { columns: ["email"], rows: [{ email: "a@b.com" }] };
    expect(countNulls(grid, "email")).toBe(0);
  });

  it("returns 0 for an empty grid", () => {
    const grid: ResultGrid = { columns: ["email"], rows: [] };
    expect(countNulls(grid, "email")).toBe(0);
  });
});

describe("countDuplicates", () => {
  it("counts extra occurrences beyond the first for a single column", () => {
    const grid: ResultGrid = {
      columns: ["id"],
      rows: [{ id: 1 }, { id: 1 }, { id: 2 }, { id: 1 }],
    };
    // id=1 appears 3 times -> 2 extras beyond the first occurrence.
    expect(countDuplicates(grid, ["id"])).toBe(2);
  });

  it("treats a composite key across multiple columns", () => {
    const grid: ResultGrid = {
      columns: ["first", "last"],
      rows: [
        { first: "A", last: "B" },
        { first: "A", last: "B" },
        { first: "A", last: "C" },
      ],
    };
    expect(countDuplicates(grid, ["first", "last"])).toBe(1);
  });

  it("does not conflate differently-split values across the composite key", () => {
    // Adversarial case for a naive string-join key: "x|y" + "z" and "x" + "y|z"
    // would collide under a "|"-joined key. JSON.stringify of the tuple keeps
    // them distinct.
    const grid: ResultGrid = {
      columns: ["a", "b"],
      rows: [
        { a: "x|y", b: "z" },
        { a: "x", b: "y|z" },
      ],
    };
    expect(countDuplicates(grid, ["a", "b"])).toBe(0);
  });

  it("treats null and the string 'null' as distinct values", () => {
    const grid: ResultGrid = {
      columns: ["a"],
      rows: [{ a: null }, { a: "null" }],
    };
    expect(countDuplicates(grid, ["a"])).toBe(0);
  });

  it("returns 0 when every row is unique", () => {
    const grid: ResultGrid = { columns: ["id"], rows: [{ id: 1 }, { id: 2 }] };
    expect(countDuplicates(grid, ["id"])).toBe(0);
  });
});
