/**
 * SQLite has no persistent per-column dtype the way pandas does — it uses
 * "manifest typing," where each individual VALUE carries its own storage
 * class (INTEGER/REAL/TEXT/NULL) regardless of the column's declared
 * affinity. That's actually a good fit for `valid_dtype`: rather than
 * reading a static schema, infer a column's effective dtype from the
 * runtime types of the values a query actually returned — which is also
 * exactly how a player's fix (e.g. `UPDATE data SET quantity =
 * CAST(quantity AS INTEGER)`) becomes visible: the returned values
 * themselves change storage class. Produces the same dtype vocabulary as
 * the Pyodide worker's `str(dataframe[col].dtype)` (afflictions.ts's
 * normalizeDtype target set) so every downstream predicate/rendering path
 * is engine-agnostic.
 */

/**
 * Deliberately narrower than general ISO-8601: no fractional seconds, no
 * zone suffix. That's not a parsing limitation — it's what makes
 * `valid_dtype: datetime` mean something in SQL. SQLite has no distinct
 * datetime storage class (ADR: dates are always TEXT), so seed CSV dates
 * (which round-trip through `Date.toISOString()`, e.g.
 * "2026-01-15T09:20:00.000Z") must NOT already match — otherwise the
 * predicate would be satisfied before the player does anything, unlike the
 * Pyodide engine where the same column starts as pandas `object` dtype
 * until `pd.to_datetime()` normalizes it. This pattern instead matches
 * exactly what SQLite's own `datetime()` function returns (its plain
 * "YYYY-MM-DD HH:MM:SS" form), so the idiomatic SQL fix —
 * `UPDATE data SET col = datetime(col)` — is the structural SQL twin of
 * `pd.to_datetime()`.
 */
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2})?)?$/;

export type SqlCellValue = string | number | null;

export function inferSqlDtype(values: SqlCellValue[]): string {
  let sawAny = false;
  let allInt = true;
  let allNumber = true;
  let allIsoDate = true;

  for (const value of values) {
    if (value === null) continue;
    sawAny = true;
    if (typeof value === "number") {
      allIsoDate = false;
      if (!Number.isInteger(value)) allInt = false;
      continue;
    }
    allNumber = false;
    if (!ISO_DATE_PATTERN.test(value)) allIsoDate = false;
  }

  if (!sawAny) return "object";
  if (allNumber) return allInt ? "int64" : "float64";
  if (allIsoDate) return "datetime64[ns]";
  return "object";
}

export function inferSqlDtypes(
  columns: string[],
  rows: Record<string, SqlCellValue>[],
): Record<string, string> {
  const dtypes: Record<string, string> = {};
  for (const column of columns) {
    dtypes[column] = inferSqlDtype(rows.map((row) => row[column] ?? null));
  }
  return dtypes;
}
