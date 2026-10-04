import type { Predicate, WinCondition } from "@dcq/content-schema";
import type { ResultGrid } from "@dcq/engine-adapters";
import { NO_RUN } from "./run-context";
import type { RunContext } from "./run-context";
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
  presentColumns,
  columnSumMatches,
  distinctCount,
} from "./afflictions";

function evaluatePredicate(
  grid: ResultGrid,
  predicate: Predicate,
  run: RunContext,
): boolean {
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
    case "runtime_under": {
      if (run.elapsedMs === null || run.engine === null) return false;
      return (
        run.elapsedMs <= (run.engine === "sql" ? predicate.sqlMs : predicate.pythonMs)
      );
    }
    case "lacks_columns":
      return presentColumns(grid, predicate.columns).length === 0;
    case "column_sum":
      return columnSumMatches(grid, predicate.column, predicate.equals);
    case "distinct_count":
      return distinctCount(grid, predicate.column) === predicate.equals;
    case "no_mojibake":
      return countMojibake(grid, predicate.column) === 0;
  }
}

export function evaluateWinCondition(
  grid: ResultGrid,
  winCondition: WinCondition,
  run: RunContext = NO_RUN,
): boolean {
  return winCondition.all.every((predicate) => evaluatePredicate(grid, predicate, run));
}
