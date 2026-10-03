import type { ResultGrid } from "@dcq/engine-adapters";
import type { Casing, Dtype } from "@dcq/content-schema";

export function countNulls(grid: ResultGrid, column: string): number {
  return nullRowIndices(grid, column).length;
}

export function nullRowIndices(grid: ResultGrid, column: string): number[] {
  const indices: number[] = [];
  grid.rows.forEach((row, i) => {
    if (row[column] === null) indices.push(i);
  });
  return indices;
}

export function countDuplicates(grid: ResultGrid, columns: string[]): number {
  return duplicateRowIndices(grid, columns).length;
}

/**
 * Every row index beyond the first occurrence within its duplicate group —
 * mirrors `.drop_duplicates()`'s default `keep="first"`, so the count here
 * is exactly how many rows a correct fix removes, and the first occurrence
 * of a repeated row is never itself flagged as the problem.
 */
export function duplicateRowIndices(grid: ResultGrid, columns: string[]): number[] {
  const seen = new Set<string>();
  const indices: number[] = [];
  grid.rows.forEach((row, i) => {
    const key = JSON.stringify(columns.map((column) => row[column] ?? null));
    if (seen.has(key)) indices.push(i);
    else seen.add(key);
  });
  return indices;
}

/** Leading/trailing whitespace on a string cell. Null cells are a separate affliction (no_nulls) and are never double-counted here. */
export function whitespaceRowIndices(grid: ResultGrid, column: string): number[] {
  const indices: number[] = [];
  grid.rows.forEach((row, i) => {
    const value = row[column];
    if (typeof value === "string" && value.trim() !== value) indices.push(i);
  });
  return indices;
}

export function countWhitespace(grid: ResultGrid, column: string): number {
  return whitespaceRowIndices(grid, column).length;
}

function titleCase(value: string): string {
  return value.replace(
    /\w\S*/g,
    (word) => (word[0]?.toUpperCase() ?? "") + word.slice(1).toLowerCase(),
  );
}

/** Null cells and cells that are already whitespace-trimmed-but-not-applicable (non-string) are skipped — casing only judges the string content itself. */
export function casingRowIndices(
  grid: ResultGrid,
  column: string,
  targetCase: Casing,
): number[] {
  const indices: number[] = [];
  grid.rows.forEach((row, i) => {
    const value = row[column];
    if (typeof value !== "string") return;
    const wantsMatch =
      targetCase === "lower"
        ? value.toLowerCase()
        : targetCase === "upper"
          ? value.toUpperCase()
          : titleCase(value);
    if (value !== wantsMatch) indices.push(i);
  });
  return indices;
}

export function countCasing(
  grid: ResultGrid,
  column: string,
  targetCase: Casing,
): number {
  return casingRowIndices(grid, column, targetCase).length;
}

/** Numeric-range check. Null and non-numeric cells are skipped — out-of-range is only meaningful once a value exists and parses as a number. */
export function outlierRowIndices(
  grid: ResultGrid,
  column: string,
  min: number,
  max: number,
): number[] {
  const indices: number[] = [];
  grid.rows.forEach((row, i) => {
    const value = row[column];
    if (typeof value !== "number") return;
    if (value < min || value > max) indices.push(i);
  });
  return indices;
}

export function countOutliers(
  grid: ResultGrid,
  column: string,
  min: number,
  max: number,
): number {
  return outlierRowIndices(grid, column, min, max).length;
}

/** Collapses a real pandas dtype string ("int64", "datetime64[ns]", ...) down to the coarse dtype vocabulary case content authors write against. Unrecognized dtypes normalize to null rather than guessing. */
export function normalizeDtype(pandasDtype: string): Dtype | null {
  if (/^u?int\d*$/i.test(pandasDtype) || pandasDtype === "Int64") return "int";
  if (/^float\d*$/i.test(pandasDtype)) return "float";
  if (pandasDtype === "bool" || pandasDtype === "boolean") return "bool";
  if (pandasDtype.startsWith("datetime64")) return "datetime";
  if (pandasDtype === "object" || pandasDtype === "string") return "string";
  return null;
}

/**
 * A column's dtype either matches or it doesn't — pandas dtype is a
 * whole-column property, not a per-cell one, so a mismatch afflicts every
 * row in the column rather than singling out individual "bad" cells.
 */
export function dtypeMatches(grid: ResultGrid, column: string, dtype: Dtype): boolean {
  const actual = grid.dtypes[column];
  return actual !== undefined && normalizeDtype(actual) === dtype;
}

export function dtypeMismatchRowIndices(
  grid: ResultGrid,
  column: string,
  dtype: Dtype,
): number[] {
  if (dtypeMatches(grid, column, dtype)) return [];
  return grid.rows.map((_, i) => i);
}

/** Non-null cells that do not match the pattern. Cells are compared as strings, so a numeric result column is still checked. */
export function patternMismatchRowIndices(
  grid: ResultGrid,
  column: string,
  pattern: string,
): number[] {
  const regex = new RegExp(pattern);
  const indices: number[] = [];
  grid.rows.forEach((row, i) => {
    const value = row[column];
    if (value === null || value === undefined) return;
    if (!regex.test(String(value))) indices.push(i);
  });
  return indices;
}

export function countPatternMismatches(
  grid: ResultGrid,
  column: string,
  pattern: string,
): number {
  return patternMismatchRowIndices(grid, column, pattern).length;
}

/** UTF-8 bytes decoded as Latin-1/Windows-1252: a lead byte (Ã, Â) or the "â€" prefix of smart punctuation. */
const MOJIBAKE = /[ÃÂ][\u0080-\u00BF\u2018-\u203A\u20AC\u0160-\u017E]|â€/;

export function mojibakeRowIndices(grid: ResultGrid, column: string): number[] {
  const indices: number[] = [];
  grid.rows.forEach((row, i) => {
    const value = row[column];
    if (typeof value === "string" && MOJIBAKE.test(value)) indices.push(i);
  });
  return indices;
}

export function countMojibake(grid: ResultGrid, column: string): number {
  return mojibakeRowIndices(grid, column).length;
}

/** Columns from `required` that the result does not have. */
export function missingColumns(grid: ResultGrid, required: string[]): string[] {
  return required.filter((column) => !grid.columns.includes(column));
}

/** Required-absent columns that are still present. */
export function presentColumns(grid: ResultGrid, forbidden: string[]): string[] {
  return forbidden.filter((column) => grid.columns.includes(column));
}

export function columnSum(grid: ResultGrid, column: string): number {
  let total = 0;
  for (const row of grid.rows) {
    const value = row[column];
    if (typeof value === "number") total += value;
  }
  return total;
}

export const COLUMN_SUM_TOLERANCE = 0.01;

export function columnSumMatches(
  grid: ResultGrid,
  column: string,
  equals: number,
): boolean {
  return (
    grid.columns.includes(column) &&
    Math.abs(columnSum(grid, column) - equals) <= COLUMN_SUM_TOLERANCE
  );
}

export function distinctCount(grid: ResultGrid, column: string): number {
  const seen = new Set<string | number | boolean>();
  for (const row of grid.rows) {
    const value = row[column];
    if (value !== null && value !== undefined) seen.add(value);
  }
  return seen.size;
}
