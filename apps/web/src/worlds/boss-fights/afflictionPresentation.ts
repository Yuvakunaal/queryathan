import type { AfflictionKind } from "../../lib/affliction-cells";
import { formatCellValue } from "./formatCellValue";

/** Badge glyph per affliction kind (design spec §0/§2.1) — shared between DataframeGrid's per-cell badge and HpHeatmap's breakdown row so the same vocabulary appears in both places. */
export const BADGE_GLYPH: Record<AfflictionKind, string> = {
  null: "NaN",
  dup: "=",
  ws: "_",
  dtype: "#",
  outlier: "^",
  date: "@",
  pattern: "~",
  encoding: "?",
};

/** Short boot-sequence scan code per kind — e.g. "scanning for affliction .. NUL+DUP" for a case stacking nulls and duplicates. */
export const SCAN_CODE: Record<AfflictionKind, string> = {
  null: "NUL",
  dup: "DUP",
  ws: "WS",
  dtype: "TYPE",
  outlier: "OOR",
  date: "DATE",
  pattern: "PAT",
  encoding: "ENC",
};

/** Accessible label per kind (design spec §2.4). `null` matches Phase 1's exact wording; the other five follow the same "{column}, row {n}, {problem}[, value {value}]" shape. */
export function ariaLabelForAffliction(
  kind: AfflictionKind,
  column: string,
  rowIndex: number,
  value: string | number | boolean | null,
): string {
  const row = String(rowIndex);
  switch (kind) {
    case "null":
      return `${column}, row ${row}, missing value`;
    case "dup":
      return `${column}, row ${row}, duplicate row`;
    case "dtype":
      return `${column}, row ${row}, wrong data type, value ${formatCellValue(value)}`;
    case "ws":
      return `${column}, row ${row}, whitespace or casing issue, value ${formatCellValue(value)}`;
    case "outlier":
      return `${column}, row ${row}, out of range, value ${formatCellValue(value)}`;
    case "date":
      return `${column}, row ${row}, invalid date, value ${formatCellValue(value)}`;
    case "pattern":
      return `${column}, row ${row}, does not match the expected pattern, value ${formatCellValue(value)}`;
    case "encoding":
      return `${column}, row ${row}, garbled text from a wrong encoding, value ${formatCellValue(value)}`;
  }
}
