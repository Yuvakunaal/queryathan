import { describe, expect, it } from "vitest";
import type { Forge, WinCondition } from "@dcq/content-schema";
import { betterStamp, budgetMs, stampFor } from "./forge";
import { evaluateWinCondition } from "./evaluate-win-condition";
import { totalDebt } from "./affliction-cells";
import type { ResultGrid } from "@dcq/engine-adapters";

const winCondition: WinCondition = {
  all: [{ predicate: "runtime_under", pythonMs: 40, sqlMs: 50 }],
};
const forge: Forge = {
  referenceMs: { python: 2, sql: 4 },
  silverMs: { python: 15, sql: 20 },
  goldMs: { python: 5, sql: 8 },
};
const grid: ResultGrid = { columns: [], rows: [], dtypes: {}, index: [] };

describe("budgetMs", () => {
  it("returns the engine's budget from the runtime rule", () => {
    expect(budgetMs(winCondition, "python")).toBe(40);
    expect(budgetMs(winCondition, "sql")).toBe(50);
    expect(
      budgetMs({ all: [{ predicate: "row_count", equals: 1 }] }, "python"),
    ).toBeNull();
  });
});

describe("stampFor", () => {
  it("awards gold, silver and bronze by speed, and nothing when over budget or untimed", () => {
    const run = (elapsedMs: number | null) => ({ elapsedMs, engine: "python" as const });
    expect(stampFor(winCondition, forge, run(3))).toBe("gold");
    expect(stampFor(winCondition, forge, run(5))).toBe("gold");
    expect(stampFor(winCondition, forge, run(10))).toBe("silver");
    expect(stampFor(winCondition, forge, run(40))).toBe("bronze");
    expect(stampFor(winCondition, forge, run(41))).toBeNull();
    expect(stampFor(winCondition, forge, run(null))).toBeNull();
  });

  it("uses the SQL cut-offs for the SQL engine", () => {
    expect(stampFor(winCondition, forge, { elapsedMs: 45, engine: "sql" })).toBe(
      "bronze",
    );
    expect(stampFor(winCondition, forge, { elapsedMs: 45, engine: "python" })).toBeNull();
  });

  it("gives bronze for any passing run when the case has no stamp thresholds", () => {
    expect(stampFor(winCondition, undefined, { elapsedMs: 1, engine: "python" })).toBe(
      "bronze",
    );
  });
});

describe("betterStamp", () => {
  it("keeps the better of two stamps", () => {
    expect(betterStamp("silver", "gold")).toBe("gold");
    expect(betterStamp("gold", "bronze")).toBe("gold");
    expect(betterStamp(undefined, "bronze")).toBe("bronze");
    expect(betterStamp("silver", undefined)).toBe("silver");
  });
});

describe("runtime_under in the win logic", () => {
  it("is unmet until a run has been timed, then judged against the engine's budget", () => {
    expect(evaluateWinCondition(grid, winCondition)).toBe(false);
    expect(
      evaluateWinCondition(grid, winCondition, { elapsedMs: 30, engine: "python" }),
    ).toBe(true);
    expect(
      evaluateWinCondition(grid, winCondition, { elapsedMs: 60, engine: "python" }),
    ).toBe(false);
    expect(totalDebt(grid, winCondition)).toBe(1);
    expect(totalDebt(grid, winCondition, { elapsedMs: 30, engine: "python" })).toBe(0);
  });
});
