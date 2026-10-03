import type { ResultGrid } from "@dcq/engine-adapters";
import type { Predicate } from "@dcq/content-schema";
import {
  columnSum,
  distinctCount,
  missingColumns,
  presentColumns,
} from "../../lib/afflictions";
import { predicateDebt } from "../../lib/affliction-cells";

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
): Omit<Check, "key"> {
  const debt = predicateDebt(grid, predicate);
  const met = debt === 0;
  switch (predicate.predicate) {
    case "row_count":
      return {
        label: `Exactly ${String(predicate.equals)} rows`,
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
        label: `${predicate.column} adds up to ${String(predicate.equals)}`,
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
    case "no_mojibake":
      return {
        label: `${predicate.column} readable`,
        detail: met ? "yes" : `${String(debt)} garbled`,
        met,
      };
  }
}
