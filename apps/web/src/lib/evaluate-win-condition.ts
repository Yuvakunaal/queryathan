import type { Predicate, WinCondition } from "@dcq/content-schema";
import type { ResultGrid } from "@dcq/engine-adapters";
import {
  countNulls,
  countDuplicates,
  countWhitespace,
  countCasing,
  countOutliers,
  dtypeMatches,
  countPatternMismatches,
  countMojibake,
  missingColumns,
} from "./afflictions";

function evaluatePredicate(grid: ResultGrid, predicate: Predicate): boolean {
  switch (predicate.predicate) {
    case "no_nulls":
      return countNulls(grid, predicate.column) === 0;
    case "no_duplicates":
      return countDuplicates(grid, predicate.columns) === 0;
    case "no_whitespace":
      return countWhitespace(grid, predicate.column) === 0;
    case "consistent_casing":
      return countCasing(grid, predicate.column, predicate.case) === 0;
    case "no_outliers":
      return countOutliers(grid, predicate.column, predicate.min, predicate.max) === 0;
    case "valid_dtype":
      return dtypeMatches(grid, predicate.column, predicate.dtype);
    case "matches_pattern":
      return countPatternMismatches(grid, predicate.column, predicate.pattern) === 0;
    case "row_count":
      return grid.rows.length === predicate.equals;
    case "has_columns":
      return missingColumns(grid, predicate.columns).length === 0;
    case "no_mojibake":
      return countMojibake(grid, predicate.column) === 0;
  }
}

export function evaluateWinCondition(
  grid: ResultGrid,
  winCondition: WinCondition,
): boolean {
  return winCondition.all.every((predicate) => evaluatePredicate(grid, predicate));
}
