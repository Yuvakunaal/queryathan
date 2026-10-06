import type { Case } from "@dcq/content-schema";
import type { ResultGrid } from "@dcq/engine-adapters";
import { parseCsv } from "../engines/csv";
import type { ColumnTip } from "./mysqlType";

/**
 * Sandbox mode: the player's own CSV. It is parsed here only to validate it,
 * tidy the header and size the columns; the engines receive the CSV text and
 * the file never leaves the browser.
 */
export const SANDBOX_LIMITS = {
  maxBytes: 5_000_000,
  maxRows: 50_000,
  maxColumns: 200,
} as const;

export interface PreparedSandbox {
  /** Comma-separated, header cleaned, ready to hand to either engine. */
  csvText: string;
  columns: string[];
  rowCount: number;
  /** Plain-language notes about anything changed on the way in. */
  notes: string[];
  /** Column widths and number-ness, worked out while the file was read, so the fight screen never parses the CSV again. */
  hints?: NonNullable<Case["columnHints"]>;
}

/** The most tables a sandbox can hold: the main one and up to three more, for practising joins. */
export const SANDBOX_MAX_TABLES = 4;

/** A table added beside the main upload. */
export interface SandboxExtra {
  /** The name used in code: a table in SQL, a DataFrame in Python. */
  name: string;
  fileName: string;
  csvText: string;
  columns: string[];
  rowCount: number;
  /** As for PreparedSandbox: worked out once, while the file was read. */
  hints?: NonNullable<Case["columnHints"]>;
  /** The tooltip (column type) for each column, worked out while the file was read. */
  tips?: Record<string, ColumnTip>;
}

const RESERVED_TABLE_NAMES = new Set(["data", "df", "result", "pd"]);

/** Turns a file name or typed name into a safe table name (lower case letters, digits and underscores, not starting with a digit). */
export function sanitizeTableName(raw: string): string {
  const base = raw
    .replace(/\.[a-z0-9]+$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const named = base === "" ? "table" : /^[0-9]/.test(base) ? `t_${base}` : base;
  return RESERVED_TABLE_NAMES.has(named) ? `${named}_2` : named;
}

/** A name nobody else is using: adds _2, _3 ... when the wanted one is taken. */
export function uniqueTableName(wanted: string, taken: string[]): string {
  const base = sanitizeTableName(wanted);
  let name = base;
  let n = 2;
  while (taken.includes(name)) {
    name = `${base}_${String(n)}`;
    n += 1;
  }
  return name;
}

/**
 * The message for a file that is too big to even read, or null when its size is fine. Checked
 * from File.size before a single byte is read; a file between the limit and twice the limit is
 * still read (off the main thread) so its exact size can be reported.
 */
export function oversizeFileMessage(size: number): string | null {
  return size > SANDBOX_LIMITS.maxBytes * 2
    ? `That file is ${(size / 1_000_000).toFixed(1)} MB. The sandbox handles files up to ${String(SANDBOX_LIMITS.maxBytes / 1_000_000)} MB.`
    : null;
}

export type SandboxResult =
  { ok: true; data: PreparedSandbox } | { ok: false; message: string };

function csvCell(value: string): string {
  return /[",\r\n]/.test(value) || /^\s|\s$/.test(value)
    ? `"${value.replaceAll('"', '""')}"`
    : value;
}

export function toCsv(columns: string[], rows: string[][]): string {
  return [columns, ...rows].map((row) => row.map(csvCell).join(",")).join("\n") + "\n";
}

/** Picks the delimiter the first line uses most: comma, semicolon or tab. */
function sniffDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const counts: [string, number][] = [
    [",", firstLine.split(",").length - 1],
    [";", firstLine.split(";").length - 1],
    ["\t", firstLine.split("\t").length - 1],
  ];
  counts.sort((a, b) => b[1] - a[1]);
  return counts[0] && counts[0][1] > 0 ? counts[0][0] : ",";
}

/** How many bytes the text takes as UTF-8, without making a copy when the answer is obvious (a UTF-16 unit is 1 to 3 bytes). */
function exceedsByteLimit(text: string): { over: boolean; byteLength: number } {
  if (text.length * 3 <= SANDBOX_LIMITS.maxBytes) return { over: false, byteLength: 0 };
  const byteLength = new TextEncoder().encode(text).length;
  return { over: byteLength > SANDBOX_LIMITS.maxBytes, byteLength };
}

interface Prepared {
  result: SandboxResult;
  /** The cleaned rows behind result.data, for the caller that wants column hints without parsing again. */
  rows: string[][];
}

export function prepareSandboxCsv(rawText: string): SandboxResult {
  return prepareRows(rawText).result;
}

/** Like prepareSandboxCsv, and also works out the grid's column hints from the rows it already has. */
export function prepareSandboxCsvWithHints(rawText: string): SandboxResult {
  const { result, rows } = prepareRows(rawText);
  if (!result.ok) return result;
  return {
    ok: true,
    data: { ...result.data, hints: columnHints(result.data.columns, rows) },
  };
}

function prepareRows(rawText: string): Prepared {
  const failed = (message: string): Prepared => ({
    result: { ok: false, message },
    rows: [],
  });
  const text = rawText.replace(/^\uFEFF/, "");
  if (text.trim() === "") {
    return failed("That file is empty. Choose a CSV with a header row and some data.");
  }
  const size = exceedsByteLimit(text);
  if (size.over) {
    return failed(
      `That file is ${(size.byteLength / 1_000_000).toFixed(1)} MB. The sandbox handles files up to ${String(SANDBOX_LIMITS.maxBytes / 1_000_000)} MB so it stays fast in your browser. Try a smaller sample of the data.`,
    );
  }

  const notes: string[] = [];
  const delimiter = sniffDelimiter(text);
  if (delimiter !== ",") {
    notes.push(
      `Read as ${delimiter === ";" ? "semicolon" : "tab"}-separated and converted to a normal CSV.`,
    );
  }
  const { columns: rawColumns, rows } = parseCsv(text, delimiter);
  if (rawColumns.length === 0 || (rawColumns.length === 1 && rawColumns[0] === "")) {
    return failed(
      "No header row found. The first line of the file must list the column names.",
    );
  }
  if (rows.length === 0) {
    return failed("The file has a header but no data rows.");
  }
  if (rawColumns.length > SANDBOX_LIMITS.maxColumns) {
    return failed(
      `That file has ${String(rawColumns.length)} columns. The sandbox handles up to ${String(SANDBOX_LIMITS.maxColumns)}.`,
    );
  }
  if (rows.length > SANDBOX_LIMITS.maxRows) {
    return failed(
      `That file has ${rows.length.toLocaleString()} rows. The sandbox handles up to ${SANDBOX_LIMITS.maxRows.toLocaleString()} so it stays fast. Try a smaller sample of the data.`,
    );
  }

  // Every column needs a unique, non-empty name: SQLite refuses duplicates,
  // and an empty name cannot be typed into code.
  const seen = new Set<string>();
  const columns = rawColumns.map((raw, index) => {
    let name = raw.trim();
    if (name === "") {
      name = `column_${String(index + 1)}`;
      notes.push(`Column ${String(index + 1)} had no name, so it is called ${name}.`);
    }
    let unique = name;
    let n = 2;
    while (seen.has(unique.toLowerCase())) {
      unique = `${name}_${String(n)}`;
      n += 1;
    }
    if (unique !== name)
      notes.push(`A second column named "${name}" was renamed ${unique}.`);
    seen.add(unique.toLowerCase());
    return unique;
  });

  // Rows shorter or longer than the header are padded or trimmed so both engines see the same table.
  let ragged = 0;
  const cleanRows = rows.map((row) => {
    if (row.length === columns.length) return row;
    ragged += 1;
    return columns.map((_, i) => row[i] ?? "");
  });
  if (ragged > 0) {
    notes.push(
      `${ragged.toLocaleString()} row(s) had a different number of fields than the header and were padded or trimmed.`,
    );
  }

  const headerChanged = columns.some((c, i) => c !== rawColumns[i]);
  const csvText =
    delimiter === "," && !headerChanged && ragged === 0
      ? text
      : toCsv(columns, cleanRows);

  return {
    result: { ok: true, data: { csvText, columns, rowCount: cleanRows.length, notes } },
    rows: cleanRows,
  };
}

/** Fits column widths to the data so the grid is readable from the first run. */
function columnHints(
  columns: string[],
  rows: string[][],
): NonNullable<Case["columnHints"]> {
  const hints: NonNullable<Case["columnHints"]> = {};
  columns.forEach((column, c) => {
    const sample = rows.slice(0, 200).map((row) => row[c] ?? "");
    const numeric =
      sample.length > 0 &&
      sample.every((v) => v.trim() === "" || Number.isFinite(Number(v.trim())));
    const longest = Math.max(column.length, ...sample.map((v) => v.length));
    hints[column] = {
      widthPx: Math.min(320, Math.max(96, Math.round(longest * 8.6 + 28))),
      numeric,
    };
  });
  return hints;
}

/** Uses the hints worked out when each file was read; only a table that arrives without them is parsed here. */
function allColumnHints(
  prepared: PreparedSandbox,
  extras: SandboxExtra[],
): NonNullable<Case["columnHints"]> {
  const hints: NonNullable<Case["columnHints"]> = {};
  for (const extra of extras) {
    Object.assign(
      hints,
      extra.hints ?? columnHints(extra.columns, parseCsv(extra.csvText).rows),
    );
  }
  return Object.assign(
    hints,
    prepared.hints ?? columnHints(prepared.columns, parseCsv(prepared.csvText).rows),
  );
}

/** Wraps a prepared upload in the Case shape the fight screen consumes. There is no win condition; the screen knows not to use it. */
export function buildSandboxCase(
  fileName: string,
  prepared: PreparedSandbox,
  extras: SandboxExtra[] = [],
): Case {
  const first = prepared.columns[0] ?? "x";
  return {
    id: "sandbox",
    world: "boss-fights",
    tier: "tutorial",
    datasetPath: "sandbox://upload",
    ...(extras.length > 0
      ? {
          extraTables: extras.map((e) => ({ name: e.name, path: `sandbox://${e.name}` })),
        }
      : {}),
    datasetLicense: {
      license: "user-supplied",
      provenance: "Loaded from your device. It is never uploaded.",
    },
    strings: {
      title: fileName,
      subtitle: "SANDBOX",
      briefing: "Your own data.",
    },
    starterCode: {
      python: "# df is your data. Try one of the ideas on the left.\ndf.head()",
      sql: "-- data is your table. Try one of the ideas on the left.\nSELECT * FROM data LIMIT 20;",
    },
    columnHints: allColumnHints(prepared, extras),
    // Never evaluated: the screen skips win checks in sandbox mode.
    winCondition: { all: [{ predicate: "has_columns", columns: [first] }] },
  };
}

function csvValue(value: string | number | boolean | null): string {
  return value === null ? "" : csvCell(String(value));
}

/** The current table as CSV, for "Download cleaned CSV". */
export function gridToCsv(grid: ResultGrid): string {
  const header = grid.columns.map(csvCell).join(",");
  const body = grid.rows.map((row) =>
    grid.columns.map((column) => csvValue(row[column] ?? null)).join(","),
  );
  return [header, ...body].join("\n") + "\n";
}

/** A short list of safe first questions to ask of any table. */
export function starterIdeas(
  language: "python" | "sql",
  columns: string[],
): { label: string; code: string }[] {
  const first = columns[0] ?? "column";
  if (language === "python") {
    return [
      { label: "See the first rows", code: "df.head(20)" },
      { label: "Count missing values per column", code: "df.isna().sum()" },
      { label: "Count repeated rows", code: "df.duplicated().sum()" },
      { label: "Summary of the numbers", code: "df.describe()" },
      {
        label: `Most common values in ${first}`,
        code: `df['${first}'].value_counts().head(10)`,
      },
      { label: "Column types", code: "df.dtypes" },
    ];
  }
  const nullChecks = columns
    .slice(0, 6)
    .map((c) => `  COUNT(*) - COUNT("${c}") AS "${c}_missing"`)
    .join(",\n");
  return [
    { label: "See the first rows", code: "SELECT * FROM data LIMIT 20;" },
    { label: "How many rows", code: "SELECT COUNT(*) AS rows FROM data;" },
    {
      label: "Count missing values per column",
      code: `SELECT\n${nullChecks}\nFROM data;`,
    },
    {
      label: `Most common values in ${first}`,
      code: `SELECT "${first}", COUNT(*) AS n\nFROM data\nGROUP BY "${first}"\nORDER BY n DESC\nLIMIT 10;`,
    },
    {
      label: "Find repeated rows",
      code: `SELECT ${columns
        .slice(0, 4)
        .map((c) => `"${c}"`)
        .join(", ")}, COUNT(*) AS n\nFROM data\nGROUP BY ${columns
        .slice(0, 4)
        .map((c) => `"${c}"`)
        .join(", ")}\nHAVING n > 1;`,
    },
  ];
}

/** Ideas for practising joins, built from whichever column names two tables share. */
export function joinIdeas(
  language: "python" | "sql",
  mainColumns: string[],
  extras: SandboxExtra[],
): { label: string; code: string }[] {
  const ideas: { label: string; code: string }[] = [];
  for (const extra of extras) {
    const shared = mainColumns.find((c) => extra.columns.includes(c));
    if (!shared) continue;
    ideas.push(
      language === "sql"
        ? {
            label: `Join with ${extra.name} on ${shared}`,
            code: `SELECT *\nFROM data d\nLEFT JOIN ${extra.name} x ON x."${shared}" = d."${shared}"\nLIMIT 20;`,
          }
        : {
            label: `Join with ${extra.name} on ${shared}`,
            code: `df.merge(${extra.name}, on='${shared}', how='left').head(20)`,
          },
    );
  }
  return ideas;
}
