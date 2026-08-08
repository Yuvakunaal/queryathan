import type { Predicate, WinCondition } from "@dcq/content-schema";
import type { ResultGrid } from "@dcq/engine-adapters";
import { countNulls, countDuplicates } from "./afflictions";

function evaluatePredicate(grid: ResultGrid, predicate: Predicate): boolean {
  switch (predicate.predicate) {
    case "no_nulls":
      return countNulls(grid, predicate.column) === 0;
    case "no_duplicates":
      return countDuplicates(grid, predicate.columns) === 0;
  }
}

export function evaluateWinCondition(
  grid: ResultGrid,
  winCondition: WinCondition,
): boolean {
  return winCondition.all.every((predicate) => evaluatePredicate(grid, predicate));
}
