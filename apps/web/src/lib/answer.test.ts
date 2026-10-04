import { describe, expect, it } from "vitest";
import type { ResultGrid } from "@dcq/engine-adapters";
import { answerDebt, compareAnswer } from "./afflictions";
import { evaluateWinCondition } from "./evaluate-win-condition";

function grid(
  columns: string[],
  rows: Record<string, string | number | null>[],
): ResultGrid {
  return { columns, rows, dtypes: {}, index: rows.map((_, i) => i) };
}

const spec = {
  columns: ["region", "total"],
  rows: [
    ["north", 10.5],
    ["south", 20],
  ],
};

describe("compareAnswer", () => {
  it("accepts the right rows in any order, with extra columns", () => {
    const g = grid(
      ["total", "region", "note"],
      [
        { region: "south", total: 20, note: "x" },
        { region: "north", total: 10.5, note: "y" },
      ],
    );
    expect(compareAnswer(g, spec).ok).toBe(true);
    expect(answerDebt(g, spec)).toBe(0);
  });

  it("tolerates float round-off but not a real difference", () => {
    const close = grid(
      ["region", "total"],
      [
        { region: "north", total: 10.504 },
        { region: "south", total: 20 },
      ],
    );
    expect(compareAnswer(close, spec).ok).toBe(true);
    const off = grid(
      ["region", "total"],
      [
        { region: "north", total: 10.6 },
        { region: "south", total: 20 },
      ],
    );
    const report = compareAnswer(off, spec);
    expect(report.ok).toBe(false);
    expect(report.matched).toEqual([false, true]);
  });

  it("reports missing columns, and counts them as debt", () => {
    const g = grid(["region"], [{ region: "north" }, { region: "south" }]);
    const report = compareAnswer(g, spec);
    expect(report.missingColumns).toEqual(["total"]);
    expect(report.ok).toBe(false);
    expect(answerDebt(g, spec)).toBeGreaterThan(0);
  });

  it("rejects extra rows and duplicated rows", () => {
    const extra = grid(
      ["region", "total"],
      [
        { region: "north", total: 10.5 },
        { region: "south", total: 20 },
        { region: "east", total: 1 },
      ],
    );
    expect(compareAnswer(extra, spec).ok).toBe(false);
    const doubled = grid(
      ["region", "total"],
      [
        { region: "north", total: 10.5 },
        { region: "north", total: 10.5 },
      ],
    );
    const report = compareAnswer(doubled, spec);
    expect(report.matchedCount).toBe(1);
    expect(report.ok).toBe(false);
  });

  it("does not take text for a number, or a different case for the same text", () => {
    const text = grid(
      ["region", "total"],
      [
        { region: "north", total: "10.5" },
        { region: "south", total: 20 },
      ],
    );
    expect(compareAnswer(text, spec).ok).toBe(false);
    const cased = grid(
      ["region", "total"],
      [
        { region: "North", total: 10.5 },
        { region: "south", total: 20 },
      ],
    );
    expect(compareAnswer(cased, spec).ok).toBe(false);
  });

  it("matches nulls with nulls", () => {
    const nullSpec = { columns: ["a"], rows: [[null], [1]] };
    expect(compareAnswer(grid(["a"], [{ a: 1 }, { a: null }]), nullSpec).ok).toBe(true);
    expect(compareAnswer(grid(["a"], [{ a: 1 }, { a: 0 }]), nullSpec).ok).toBe(false);
  });

  it("only cares about order when asked to", () => {
    const swapped = grid(
      ["region", "total"],
      [
        { region: "south", total: 20 },
        { region: "north", total: 10.5 },
      ],
    );
    expect(compareAnswer(swapped, spec).ok).toBe(true);
    const ordered = compareAnswer(swapped, { ...spec, ordered: true });
    expect(ordered.ok).toBe(false);
    expect(ordered.orderOk).toBe(false);
    expect(answerDebt(swapped, { ...spec, ordered: true })).toBe(1);
  });

  it("is a win condition predicate", () => {
    const g = grid(
      ["region", "total"],
      [
        { region: "north", total: 10.5 },
        { region: "south", total: 20 },
      ],
    );
    expect(
      evaluateWinCondition(g, { all: [{ predicate: "result_matches", ...spec }] }),
    ).toBe(true);
  });
});
