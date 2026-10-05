import type { ResultGrid } from "@dcq/engine-adapters";
import type { Predicate } from "@dcq/content-schema";
import {
  columnSum,
  distinctCount,
  missingColumns,
  presentColumns,
} from "../../lib/afflictions";
import { compareAnswer } from "../../lib/afflictions";
import { predicateDebt } from "../../lib/affliction-cells";
import { NO_RUN } from "../../lib/run-context";
import type { RunContext } from "../../lib/run-context";

const DTYPE_WORDS = {
  int: "whole numbers",
  float: "decimal numbers",
  bool: "true/false values",
  string: "text",
  datetime: "proper dates",
} as const;

export interface Check {
  key: string;
  label: string;
  detail: string;
  met: boolean;
}

export function describePredicate(
  grid: ResultGrid,
  predicate: Predicate,
  run: RunContext = NO_RUN,
): Omit<Check, "key"> {
  const debt = predicateDebt(grid, predicate, run);
  const met = debt === 0;
  switch (predicate.predicate) {
    case "row_count":
      return {
        label: `Exactly ${predicate.equals.toLocaleString()} rows`,
        detail: met ? "yes" : `has ${String(grid.rows.length)}`,
        met,
      };
    case "has_columns":
      return {
        label: `Has ${predicate.columns.join(", ")}`,
        detail: met
          ? "yes"
          : `missing ${missingColumns(grid, predicate.columns).join(", ")}`,
        met,
      };
    case "no_nulls":
      return {
        label: `No gaps in ${predicate.column}`,
        detail: met ? "yes" : `${String(debt)} empty`,
        met,
      };
    case "no_duplicates":
      return {
        label: `No repeated rows (same ${predicate.columns.join(", ")})`,
        detail: met ? "yes" : `${String(debt)} repeated`,
        met,
      };
    case "no_whitespace":
      return {
        label: `No stray spaces in ${predicate.column}`,
        detail: met ? "yes" : `${String(debt)} cells`,
        met,
      };
    case "consistent_casing":
      return {
        label: `${predicate.column} in ${predicate.case} case`,
        detail: met ? "yes" : `${String(debt)} cells`,
        met,
      };
    case "no_outliers":
      return {
        label: `${predicate.column} between ${String(predicate.min)} and ${String(predicate.max)}`,
        detail: met ? "yes" : `${String(debt)} outside`,
        met,
      };
    case "valid_dtype":
      return {
        label: `${predicate.column} holds ${DTYPE_WORDS[predicate.dtype]}`,
        detail: met ? "yes" : "wrong type",
        met,
      };
    case "matches_pattern":
      return {
        label: `${predicate.column} fits the pattern`,
        detail: met ? "yes" : `${String(debt)} cells`,
        met,
      };
    case "runtime_under": {
      const budget = run.engine === "sql" ? predicate.sqlMs : predicate.pythonMs;
      return {
        label: `Last run finishes in under ${String(budget)} ms`,
        detail:
          run.elapsedMs === null
            ? "run your code to time it"
            : `last run took ${String(Math.round(run.elapsedMs))} ms`,
        met,
      };
    }
    case "lacks_columns":
      return {
        label: `Without ${predicate.columns.join(", ")}`,
        detail: met
          ? "yes"
          : `still has ${presentColumns(grid, predicate.columns).join(", ")}`,
        met,
      };
    case "column_sum":
      return {
        label: `${predicate.column} adds up to ${predicate.equals.toLocaleString()}`,
        detail: met
          ? "yes"
          : grid.columns.includes(predicate.column)
            ? `adds to ${String(Math.round(columnSum(grid, predicate.column) * 100) / 100)}`
            : "missing",
        met,
      };
    case "distinct_count":
      return {
        label: `${String(predicate.equals)} distinct ${predicate.column}`,
        detail: met ? "yes" : `has ${String(distinctCount(grid, predicate.column))}`,
        met,
      };
    case "result_matches": {
      const report = compareAnswer(grid, predicate);
      const wrong = report.expectedRows - report.matchedCount;
      let detail = "yes";
      if (!report.ok) {
        if (report.missingColumns.length > 0)
          detail = `missing column ${report.missingColumns.join(", ")}`;
        else if (report.rowCount !== report.expectedRows)
          detail = `has ${String(report.rowCount)} ${report.rowCount === 1 ? "row" : "rows"}, expected ${String(report.expectedRows)}`;
        else if (wrong > 0)
          detail = `${String(report.matchedCount)} of ${String(report.expectedRows)} rows right`;
        else detail = "right rows, wrong order";
      }
      return {
        label: `Your answer has ${predicate.columns.join(", ")} with the expected ${String(predicate.rows.length)} ${predicate.rows.length === 1 ? "row" : "rows"}`,
        detail,
        met,
      };
    }
    case "no_mojibake":
      return {
        label: `${predicate.column} readable`,
        detail: met ? "yes" : `${String(debt)} garbled`,
        met,
      };
  }
}
