import type { ResultGrid } from "@dcq/engine-adapters";
import { parseCsv } from "../engines/csv";

/** A CSV as a grid, with number columns read as numbers and empty cells as nulls (used to show tables as originally loaded). */
export function csvToGrid(text: string): ResultGrid {
  const { columns, rows } = parseCsv(text);
  const asNumber = (value: string): number | null => {
    const trimmed = value.trim();
    return trimmed !== "" && Number.isFinite(Number(trimmed)) ? Number(trimmed) : null;
  };
  const numericColumns = new Set(
    columns.filter((_, c) =>
      rows.every((row) => (row[c] ?? "") === "" || asNumber(row[c] ?? "") !== null),
    ),
  );
  return {
    columns,
    rows: rows.map((row) => {
      const out: Record<string, string | number | null> = {};
      columns.forEach((column, c) => {
        const value = row[c] ?? "";
        out[column] =
          value === "" ? null : numericColumns.has(column) ? Number(value) : value;
      });
      return out;
    }),
    dtypes: Object.fromEntries(
      columns.map((c) => [
        c,
        numericColumns.has(c)
          ? rows.every((row) =>
              Number.isInteger(asNumber(row[columns.indexOf(c)] ?? "") ?? 0),
            )
            ? "int64"
            : "float64"
          : "object",
      ]),
    ),
    index: rows.map((_, i) => i),
  };
}
