import type { Case } from "@dcq/content-schema";
import type { ResultGrid } from "@dcq/engine-adapters";
import { parseCsv } from "../engines/csv";

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

export function prepareSandboxCsv(rawText: string): SandboxResult {
  const text = rawText.replace(/^\uFEFF/, "");
  if (text.trim() === "") {
    return {
      ok: false,
      message: "That file is empty. Choose a CSV with a header row and some data.",
    };
  }
  const byteLength = new TextEncoder().encode(text).length;
  if (byteLength > SANDBOX_LIMITS.maxBytes) {
    return {
      ok: false,
      message: `That file is ${(byteLength / 1_000_000).toFixed(1)} MB. The sandbox handles files up to ${String(SANDBOX_LIMITS.maxBytes / 1_000_000)} MB so it stays fast in your browser. Try a smaller sample of the data.`,
    };
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
    return {
      ok: false,
      message:
        "No header row found. The first line of the file must list the column names.",
    };
  }
  if (rows.length === 0) {
    return { ok: false, message: "The file has a header but no data rows." };
  }
  if (rawColumns.length > SANDBOX_LIMITS.maxColumns) {
    return {
      ok: false,
      message: `That file has ${String(rawColumns.length)} columns. The sandbox handles up to ${String(SANDBOX_LIMITS.maxColumns)}.`,
    };
  }
  if (rows.length > SANDBOX_LIMITS.maxRows) {
    return {
      ok: false,
      message: `That file has ${rows.length.toLocaleString()} rows. The sandbox handles up to ${SANDBOX_LIMITS.maxRows.toLocaleString()} so it stays fast. Try a smaller sample of the data.`,
    };
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

  return { ok: true, data: { csvText, columns, rowCount: cleanRows.length, notes } };
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

/** Wraps a prepared upload in the Case shape the fight screen consumes. There is no win condition; the screen knows not to use it. */
export function buildSandboxCase(fileName: string, prepared: PreparedSandbox): Case {
  const { rows } = parseCsv(prepared.csvText);
  const first = prepared.columns[0] ?? "x";
  return {
    id: "sandbox",
    world: "boss-fights",
    tier: "tutorial",
    datasetPath: "sandbox://upload",
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
    columnHints: columnHints(prepared.columns, rows),
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
