import { describe, expect, it } from "vitest";
import { evaluateWinCondition } from "./evaluate-win-condition";
import type { ResultGrid } from "@dcq/engine-adapters";
import type { WinCondition } from "@dcq/content-schema";

describe("evaluateWinCondition", () => {
  it("is satisfied when a single no_nulls predicate has no remaining nulls", () => {
    const grid: ResultGrid = { columns: ["email"], rows: [{ email: "a@b.com" }] };
    const winCondition: WinCondition = {
      all: [{ predicate: "no_nulls", column: "email" }],
    };
    expect(evaluateWinCondition(grid, winCondition)).toBe(true);
  });

  it("is not satisfied while a no_nulls predicate still has nulls", () => {
    const grid: ResultGrid = { columns: ["email"], rows: [{ email: null }] };
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
    };
    const winCondition: WinCondition = {
      all: [
        { predicate: "no_nulls", column: "email" },
        { predicate: "no_duplicates", columns: ["id"] },
      ],
    };
    expect(evaluateWinCondition(grid, winCondition)).toBe(true);
  });
});
