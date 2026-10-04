import type { ResultGrid } from "@dcq/engine-adapters";

/**
 * What a column would be as a MySQL column, worked out from its values. A CSV has
 * no declared types, so this answers the practical question: "which MySQL type is
 * the smallest, exact fit for what is in this column?". The rules are deliberate
 * and spelled out, so the answer is always explainable:
 *
 *  - whole numbers: the smallest of TINYINT, SMALLINT, MEDIUMINT, INT, BIGINT that
 *    holds every value (all signed);
 *  - numbers with decimals: DECIMAL(p,s) with exactly the decimals and digits the
 *    values need, or DOUBLE when they need more than 6 decimals;
 *  - dates and times written the standard way: DATE, TIME, DATETIME or DATETIME(3/6);
 *  - true/false values: BOOLEAN (stored as TINYINT(1));
 *  - everything else: VARCHAR(n) with n the longest value, or TEXT/MEDIUMTEXT
 *    beyond 255 characters;
 *  - a column that is empty everywhere: VARCHAR(255), as there is nothing to go on.
 *
 * Only the type is shown: the tooltip answers one question and nothing else.
 */
export type Cell = string | number | boolean | null | undefined;

export interface ColumnTip {
  /** e.g. "DECIMAL(5,2)". */
  mysql: string;
}

const INT_RANGES: [string, number, number][] = [
  ["TINYINT", -128, 127],
  ["SMALLINT", -32_768, 32_767],
  ["MEDIUMINT", -8_388_608, 8_388_607],
  ["INT", -2_147_483_648, 2_147_483_647],
];

function intType(values: number[]): string {
  const low = Math.min(...values);
  const high = Math.max(...values);
  for (const [name, min, max] of INT_RANGES) if (low >= min && high <= max) return name;
  return "BIGINT";
}

function decimalsOf(value: number): number {
  const text = String(value);
  if (/e/i.test(text)) return 99; // exponent notation: not a plain decimal
  const dot = text.indexOf(".");
  return dot === -1 ? 0 : text.length - dot - 1;
}

function integerDigitsOf(value: number): number {
  return String(Math.trunc(Math.abs(value))).length;
}

const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATETIME =
  /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,6}))?(Z)?$/;
const TIME = /^\d{2}:\d{2}:\d{2}$/;

function validDate(y: string, m: string, d: string): boolean {
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  return (
    date.getUTCFullYear() === Number(y) &&
    date.getUTCMonth() === Number(m) - 1 &&
    date.getUTCDate() === Number(d)
  );
}

interface Inference {
  mysql: string;
}

function inferFromValues(present: Cell[]): Inference {
  if (present.length === 0) {
    return {
      mysql: "VARCHAR(255)",
    };
  }
  if (present.every((v) => typeof v === "boolean")) return { mysql: "BOOLEAN" };

  if (present.every((v) => typeof v === "number")) {
    const numbers = present;
    if (numbers.every((n) => Number.isInteger(n))) return { mysql: intType(numbers) };
    const decimals = Math.max(...numbers.map(decimalsOf));
    if (decimals > 6) return { mysql: "DOUBLE" };
    const digits = Math.max(...numbers.map(integerDigitsOf));
    return {
      mysql: `DECIMAL(${String(Math.max(1, digits + decimals))},${String(decimals)})`,
    };
  }

  if (present.every((v) => typeof v === "string")) {
    const strings = present;
    if (strings.every((s) => /^(true|false)$/i.test(s))) {
      return {
        mysql: "BOOLEAN",
      };
    }
    if (
      strings.every((s) => {
        const m = DATE.exec(s);
        return m !== null && validDate(m[1] ?? "", m[2] ?? "", m[3] ?? "");
      })
    ) {
      return { mysql: "DATE" };
    }
    if (strings.every((s) => TIME.test(s))) return { mysql: "TIME" };
    const stamps = strings.map((s) => DATETIME.exec(s));
    if (
      stamps.every(
        (m): m is RegExpExecArray =>
          m !== null && validDate(m[1] ?? "", m[2] ?? "", m[3] ?? ""),
      )
    ) {
      const fraction = Math.max(...stamps.map((m) => (m[7] ?? "").length));
      const precision = fraction === 0 ? "" : fraction <= 3 ? "(3)" : "(6)";
      return {
        mysql: `DATETIME${precision}`,
      };
    }
    const longest = Math.max(...strings.map((s) => Array.from(s).length));
    if (longest <= 255) return { mysql: `VARCHAR(${String(Math.max(1, longest))})` };
    return { mysql: longest <= 65_535 ? "TEXT" : "MEDIUMTEXT" };
  }

  const longest = Math.max(...present.map((v) => Array.from(String(v)).length));
  return {
    mysql: `VARCHAR(${String(Math.min(255, Math.max(1, longest)))})`,
  };
}

/** The MySQL type of one column, from its values. */
export function describeColumn(values: readonly Cell[]): ColumnTip {
  const present = values.filter((v) => v !== null && v !== undefined && v !== "");
  return { mysql: inferFromValues(present).mysql };
}

const tipCache = new WeakMap<ResultGrid, Record<string, ColumnTip>>();

/**
 * Tooltips for every column of a grid. Samples at most 5,000 rows, which is plenty to
 * settle a type, and remembers the answer for a grid it has already seen, so drawing the
 * screen again does not redo the work.
 */
export function columnTipsFor(grid: ResultGrid): Record<string, ColumnTip> {
  const cached = tipCache.get(grid);
  if (cached) return cached;
  const rows = grid.rows.length > 5000 ? grid.rows.slice(0, 5000) : grid.rows;
  const tips: Record<string, ColumnTip> = {};
  for (const column of grid.columns) {
    tips[column] = describeColumn(rows.map((row) => row[column]));
  }
  tipCache.set(grid, tips);
  return tips;
}
