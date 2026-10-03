import { describe, expect, it } from "vitest";
import { evaluateWinCondition } from "./evaluate-win-condition";
import type { ResultGrid } from "@dcq/engine-adapters";
import type { WinCondition } from "@dcq/content-schema";

describe("evaluateWinCondition", () => {
  it("is satisfied when a single no_nulls predicate has no remaining nulls", () => {
    const grid: ResultGrid = {
      columns: ["email"],
      rows: [{ email: "a@b.com" }],
      dtypes: {},
      index: [0],
    };
    const winCondition: WinCondition = {
      all: [{ predicate: "no_nulls", column: "email" }],
    };
    expect(evaluateWinCondition(grid, winCondition)).toBe(true);
  });

  it("is not satisfied while a no_nulls predicate still has nulls", () => {
    const grid: ResultGrid = {
      columns: ["email"],
      rows: [{ email: null }],
      dtypes: {},
      index: [0],
    };
    const winCondition: WinCondition = {
      all: [{ predicate: "no_nulls", column: "email" }],
    };
    expect(evaluateWinCondition(grid, winCondition)).toBe(false);
  });

  it("requires every predicate in 'all' to pass", () => {
    const grid: ResultGrid = {
      columns: ["email", "id"],
      rows: [
        { email: "a@b.com", id: 1 },
        { email: "c@d.com", id: 1 },
      ],
      dtypes: {},
      index: [0, 1],
    };
    const winCondition: WinCondition = {
      all: [
        { predicate: "no_nulls", column: "email" },
        { predicate: "no_duplicates", columns: ["id"] },
      ],
    };
    // no_nulls passes, no_duplicates fails (id=1 repeated) -> overall false.
    expect(evaluateWinCondition(grid, winCondition)).toBe(false);
  });

  it("passes when all predicates in 'all' are satisfied", () => {
    const grid: ResultGrid = {
      columns: ["email", "id"],
      rows: [
        { email: "a@b.com", id: 1 },
        { email: "c@d.com", id: 2 },
      ],
      dtypes: {},
      index: [0, 1],
    };
    const winCondition: WinCondition = {
      all: [
        { predicate: "no_nulls", column: "email" },
        { predicate: "no_duplicates", columns: ["id"] },
      ],
    };
    expect(evaluateWinCondition(grid, winCondition)).toBe(true);
  });

  it("evaluates no_whitespace, consistent_casing, no_outliers, and valid_dtype predicates", () => {
    const grid: ResultGrid = {
      columns: ["email", "age"],
      rows: [{ email: "a@b.com", age: 30 }],
      dtypes: { email: "object", age: "int64" },
      index: [0],
    };
    const winCondition: WinCondition = {
      all: [
        { predicate: "no_whitespace", column: "email" },
        { predicate: "consistent_casing", column: "email", case: "lower" },
        { predicate: "no_outliers", column: "age", min: 0, max: 120 },
        { predicate: "valid_dtype", column: "age", dtype: "int" },
      ],
    };
    expect(evaluateWinCondition(grid, winCondition)).toBe(true);
  });

  it("fails a stacked win condition when only one of several predicates is unmet", () => {
    const grid: ResultGrid = {
      columns: ["email", "age"],
      rows: [{ email: " a@b.com", age: 30 }],
      dtypes: { email: "object", age: "int64" },
      index: [0],
    };
    const winCondition: WinCondition = {
      all: [
        { predicate: "no_whitespace", column: "email" },
        { predicate: "no_outliers", column: "age", min: 0, max: 120 },
      ],
    };
    // no_outliers passes, no_whitespace fails (leading space) -> overall false.
    expect(evaluateWinCondition(grid, winCondition)).toBe(false);
  });

  it("fails valid_dtype when the column's real dtype does not match", () => {
    const grid: ResultGrid = {
      columns: ["signup_year"],
      rows: [{ signup_year: "2020" }],
      dtypes: { signup_year: "object" },
      index: [0],
    };
    const winCondition: WinCondition = {
      all: [{ predicate: "valid_dtype", column: "signup_year", dtype: "int" }],
    };
    expect(evaluateWinCondition(grid, winCondition)).toBe(false);
  });
});

describe("whole-table predicates", () => {
  const grid: ResultGrid = {
    columns: ["order_id", "customer_name"],
    rows: [
      { order_id: 1, customer_name: "A" },
      { order_id: 2, customer_name: "B" },
    ],
    dtypes: {},
    index: [0, 1],
  };

  it("row_count requires the exact number of rows", () => {
    expect(
      evaluateWinCondition(grid, { all: [{ predicate: "row_count", equals: 2 }] }),
    ).toBe(true);
    expect(
      evaluateWinCondition(grid, { all: [{ predicate: "row_count", equals: 3 }] }),
    ).toBe(false);
  });

  it("has_columns requires every listed column to exist", () => {
    expect(
      evaluateWinCondition(grid, {
        all: [{ predicate: "has_columns", columns: ["order_id", "customer_name"] }],
      }),
    ).toBe(true);
    expect(
      evaluateWinCondition(grid, {
        all: [{ predicate: "has_columns", columns: ["order_id", "city"] }],
      }),
    ).toBe(false);
  });
});
