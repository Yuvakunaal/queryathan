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
 */
export type Cell = string | number | boolean | null | undefined;

export interface ColumnTip {
  /** e.g. "DECIMAL(5,2)". */
  mysql: string;
  /** The tooltip body, one line per entry. */
  lines: string[];
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
  note?: string;
}

function inferFromValues(present: Cell[]): Inference {
  if (present.length === 0) {
    return {
      mysql: "VARCHAR(255)",
      note: "Every value is empty, so there is nothing to go on.",
    };
  }
  if (present.every((v) => typeof v === "boolean"))
    return { mysql: "BOOLEAN", note: "Stored by MySQL as TINYINT(1)." };

  if (present.every((v) => typeof v === "number")) {
    const numbers = present;
    if (numbers.every((n) => Number.isInteger(n))) return { mysql: intType(numbers) };
    const decimals = Math.max(...numbers.map(decimalsOf));
    if (decimals > 6)
      return { mysql: "DOUBLE", note: "These values need more than 6 decimal places." };
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
        note: "Text true/false; MySQL stores BOOLEAN as TINYINT(1).",
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
      const zone = stamps.some((m) => m[8] === "Z");
      return {
        mysql: `DATETIME${precision}`,
        ...(zone
          ? {
              note: "The values end in Z (UTC); MySQL's DATETIME holds no time zone, so drop the Z when loading.",
            }
          : {}),
      };
    }
    const longest = Math.max(...strings.map((s) => Array.from(s).length));
    const wholeNumbers = strings.every((s) => /^-?\d+$/.test(s.trim()));
    const note = wholeNumbers
      ? "Every value is a whole number stored as text; an INT column would hold them too."
      : undefined;
    if (longest <= 255)
      return {
        mysql: `VARCHAR(${String(Math.max(1, longest))})`,
        ...(note ? { note } : {}),
      };
    return {
      mysql: longest <= 65_535 ? "TEXT" : "MEDIUMTEXT",
      ...(note ? { note } : {}),
    };
  }

  const longest = Math.max(...present.map((v) => Array.from(String(v)).length));
  return {
    mysql: `VARCHAR(${String(Math.min(255, Math.max(1, longest)))})`,
    note: "The column mixes numbers and text, so it has to be text.",
  };
}

const SQLITE_STORAGE: Record<string, string> = {
  int64: "INTEGER",
  Int64: "INTEGER",
  float64: "REAL",
  bool: "INTEGER (0 or 1)",
  boolean: "INTEGER (0 or 1)",
  object: "TEXT",
  string: "TEXT",
};

/** The tooltip for one column, from its values. `dtype` is the engine's own name for the type. */
export function describeColumn(
  name: string,
  values: readonly Cell[],
  dtype: string | undefined,
  engine: "python" | "sql",
): ColumnTip {
  const present = values.filter((v) => v !== null && v !== undefined && v !== "");
  const empties = values.length - present.length;
  const { mysql, note } = inferFromValues(present);
  const lines: string[] = [];
  lines.push(
    empties > 0
      ? `NULL allowed: ${empties.toLocaleString()} of ${values.length.toLocaleString()} values are empty.`
      : `NOT NULL fits: none of the ${values.length.toLocaleString()} values is empty.`,
  );
  if (present.length > 1 && new Set(present).size === present.length && empties === 0) {
    lines.push("Every value is different, so it could be a key.");
  }
  if (note) lines.push(note);
  lines.push("Worked out from the values here, since a CSV has no declared types.");
  if (dtype) {
    lines.push(
      engine === "python"
        ? `pandas dtype: ${dtype}`
        : `SQLite stores it as ${SQLITE_STORAGE[dtype] ?? dtype.toUpperCase()}.`,
    );
  }
  void name;
  return { mysql, lines };
}

const tipCache = new WeakMap<ResultGrid, Map<string, Record<string, ColumnTip>>>();

/**
 * Tooltips for every column of a grid. Samples at most 5,000 rows, which is plenty to
 * settle a type, and remembers the answer for a grid it has already seen, so drawing the
 * screen again does not redo the work.
 */
export function columnTipsFor(
  grid: ResultGrid,
  engine: "python" | "sql",
): Record<string, ColumnTip> {
  const cached = tipCache.get(grid)?.get(engine);
  if (cached) return cached;
  const rows = grid.rows.length > 5000 ? grid.rows.slice(0, 5000) : grid.rows;
  const tips: Record<string, ColumnTip> = {};
  for (const column of grid.columns) {
    tips[column] = describeColumn(
      column,
      rows.map((row) => row[column]),
      grid.dtypes[column],
      engine,
    );
  }
  const byEngine = tipCache.get(grid) ?? new Map<string, Record<string, ColumnTip>>();
  byEngine.set(engine, tips);
  tipCache.set(grid, byEngine);
  return tips;
}
