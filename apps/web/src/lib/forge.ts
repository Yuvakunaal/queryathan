import type { Forge, WinCondition } from "@dcq/content-schema";
import type { RunContext } from "./run-context";

export type Stamp = "bronze" | "silver" | "gold";

export const STAMP_RANK: Record<Stamp, number> = { bronze: 1, silver: 2, gold: 3 };

/** The pass mark (bronze) for the engine in use, from the case's runtime_under rule. */
export function budgetMs(
  winCondition: WinCondition,
  engine: "python" | "sql",
): number | null {
  for (const predicate of winCondition.all) {
    if (predicate.predicate === "runtime_under") {
      return engine === "sql" ? predicate.sqlMs : predicate.pythonMs;
    }
  }
  return null;
}

/**
 * The quality stamp a run earns: bronze for meeting the budget, silver and
 * gold for beating the tighter cut-offs. null when the run is over budget or
 * has not been measured.
 */
export function stampFor(
  winCondition: WinCondition,
  forge: Forge | undefined,
  run: RunContext,
): Stamp | null {
  if (run.elapsedMs === null || run.engine === null) return null;
  const budget = budgetMs(winCondition, run.engine);
  if (budget === null || run.elapsedMs > budget) return null;
  if (forge) {
    if (run.elapsedMs <= forge.goldMs[run.engine]) return "gold";
    if (run.elapsedMs <= forge.silverMs[run.engine]) return "silver";
  }
  return "bronze";
}

export function betterStamp(
  a: Stamp | undefined,
  b: Stamp | undefined,
): Stamp | undefined {
  if (!a) return b;
  if (!b) return a;
  return STAMP_RANK[a] >= STAMP_RANK[b] ? a : b;
}
