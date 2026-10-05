import { prepareSql } from "./sqlRewrite";
import { registerFriendlyFunctions, registerStatAggregates } from "./sqlFunctions";
import initSqlJs from "sql.js";
import type { Database, SqlValue } from "sql.js";
// Vite resolves this to a hashed, self-hosted asset URL at build time — no
// CDN, no manual copy step (contrast with Pyodide's self-hosting, which
// needs scripts/fetch-pyodide.mjs because its distribution isn't a single
// importable npm package the bundler can just follow).
import sqlWasmUrl from "sql.js/dist/sql-wasm.wasm?url";
import type {
  EngineErrorResponse,
  EngineReadyResponse,
  ResultGrid,
  OutputTable,
  RunErrorResponse,
  RunResultResponse,
  WorkerRequest,
} from "@dcq/engine-adapters";
import {
  MAX_OUTPUT_ROWS,
  generatedColumnKind,
  generatedValue,
} from "@dcq/engine-adapters";
import type { GeneratedDataset } from "@dcq/engine-adapters";
import { coerceCsvValue, inferColumnTypes, parseCsv } from "./csv";
import type { CsvValue } from "./csv";
import { inferSqlDtypes } from "./sql-dtypes";
import type { SqlCellValue } from "./sql-dtypes";

const TABLE_NAME = "data";
const ROW_ID_ALIAS = "__dcq_row_id__";

let db: Database | null = null;

const sqlJsReady = initSqlJs({ locateFile: () => sqlWasmUrl });

sqlJsReady
  .then(() => {
    postMessage({ type: "ready" } satisfies EngineReadyResponse);
  })
  .catch((error: unknown) => {
    console.error("sql.js failed to initialize:", error);
    const message = error instanceof Error ? error.message : String(error);
    postMessage({ type: "engine-error", message } satisfies EngineErrorResponse);
  });

function quoteIdentifier(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

function isScalar(value: unknown): value is string | number | bigint | boolean {
  return (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "bigint" ||
    typeof value === "boolean"
  );
}

const regexCache = new Map<string, RegExp>();
function compile(pattern: string): RegExp {
  let regex = regexCache.get(pattern);
  if (!regex) {
    regex = new RegExp(pattern);
    regexCache.set(pattern, regex);
  }
  return regex;
}

/**
 * SQLite parses `X REGEXP Y` but ships no implementation. These make World 2's
 * pattern work possible in SQL: `REGEXP` (pattern, text), plus two helpers
 * SQLite also lacks, `REGEXP_EXTRACT(text, pattern)` (first capture group, else
 * the whole match) and `REGEXP_REPLACE(text, pattern, replacement)`. Patterns
 * use JavaScript regex syntax.
 */
function registerRegexFunctions(database: Database): void {
  registerFriendlyFunctions(database);
  registerStatAggregates(database as never);
  database.create_function("regexp", (pattern: unknown, text: unknown) => {
    if (typeof pattern !== "string" || !isScalar(text)) return null;
    return compile(pattern).test(String(text)) ? 1 : 0;
  });
  database.create_function("regexp_extract", (text: unknown, pattern: unknown) => {
    if (typeof pattern !== "string" || !isScalar(text)) return null;
    const match = compile(pattern).exec(String(text));
    return match ? (match[1] ?? match[0]) : null;
  });
  database.create_function(
    "regexp_replace",
    (text: unknown, pattern: unknown, replacement: unknown) => {
      if (typeof pattern !== "string" || !isScalar(text)) return null;
      return String(text).replace(
        new RegExp(pattern, "g"),
        isScalar(replacement) ? String(replacement) : "",
      );
    },
  );
}

/** Builds the stress-test table from its recipe, matching the Python side value for value. */
async function loadGeneratedIntoTable(
  spec: GeneratedDataset,
  tableName: string,
): Promise<void> {
  const SQL = await sqlJsReady;
  db?.close();
  db = new SQL.Database();
  registerRegexFunctions(db);
  const definitions = spec.columns
    .map((c) => `${quoteIdentifier(c.name)} ${generatedColumnKind(c)}`)
    .join(", ");
  db.run(`CREATE TABLE ${quoteIdentifier(tableName)} (${definitions});`);
  const placeholders = spec.columns.map(() => "?").join(", ");
  const stmt = db.prepare(
    `INSERT INTO ${quoteIdentifier(tableName)} VALUES (${placeholders});`,
  );
  db.run("BEGIN TRANSACTION;");
  try {
    for (let i = 0; i < spec.rows; i += 1) {
      stmt.run(spec.columns.map((c) => generatedValue(c, i)));
    }
    db.run("COMMIT;");
  } catch (error) {
    db.run("ROLLBACK;");
    throw error;
  } finally {
    stmt.free();
  }
}

async function loadCsvIntoTable(
  datasetUrl: string,
  tableName: string,
  freshDatabase: boolean,
  inlineText?: string,
): Promise<void> {
  const SQL = await sqlJsReady;
  let csvText = inlineText;
  if (csvText === undefined) {
    const response = await fetch(datasetUrl);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch dataset: ${String(response.status)} ${response.statusText}`,
      );
    }
    csvText = await response.text();
  }
  const { columns, rows } = parseCsv(csvText);
  const columnTypes = inferColumnTypes(columns, rows);

  if (freshDatabase || !db) {
    db?.close();
    db = new SQL.Database();
    registerRegexFunctions(db);
  }

  const createColumns = columns.map((column) => quoteIdentifier(column)).join(", ");
  db.run(`CREATE TABLE ${quoteIdentifier(tableName)} (${createColumns});`);

  const placeholders = columns.map(() => "?").join(", ");
  const insertColumns = columns.map((column) => quoteIdentifier(column)).join(", ");
  const stmt = db.prepare(
    `INSERT INTO ${quoteIdentifier(tableName)} (${insertColumns}) VALUES (${placeholders});`,
  );
  db.run("BEGIN TRANSACTION;");
  try {
    for (const row of rows) {
      const values: CsvValue[] = columns.map((column, i) =>
        coerceCsvValue(row[i], columnTypes[column] ?? "string"),
      );
      stmt.run(values);
    }
    db.run("COMMIT;");
  } catch (error) {
    db.run("ROLLBACK;");
    throw error;
  } finally {
    stmt.free();
  }
}

/** One table or view as a grid. Reads nothing of the player's data table unless asked. */
function serializeNamed(name: string, rowIds: "rowid" | "sequence"): ResultGrid {
  if (!db) throw new Error("No dataset loaded yet.");
  const exists =
    (db.exec("SELECT 1 FROM sqlite_master WHERE name = ?;", [name])[0]?.values.length ??
      0) > 0;
  if (!exists) return { columns: [], rows: [], dtypes: {}, index: [] };
  const quoted = quoteIdentifier(name);
  const result = db.exec(
    rowIds === "rowid"
      ? `SELECT rowid AS ${ROW_ID_ALIAS}, * FROM ${quoted} ORDER BY rowid;`
      : `SELECT ROW_NUMBER() OVER () AS ${ROW_ID_ALIAS}, * FROM ${quoted};`,
  );
  const first = result[0];
  if (!first) return { columns: [], rows: [], dtypes: {}, index: [] };

  const [, ...columns] = first.columns;
  const index: (string | number)[] = [];
  const rows: Record<string, string | number | boolean | null>[] = [];
  for (const values of first.values) {
    const [rowId, ...cellValues] = values;
    index.push(rowId as string | number);
    const row: Record<string, string | number | boolean | null> = {};
    columns.forEach((column, i) => {
      const value = cellValues[i];
      row[column] = value === undefined || value instanceof Uint8Array ? null : value;
    });
    rows.push(row);
  }

  const dtypeRows: Record<string, SqlCellValue>[] = rows.map((row) => {
    const out: Record<string, SqlCellValue> = {};
    for (const column of columns) {
      const value = row[column] ?? null;
      out[column] = typeof value === "boolean" ? Number(value) : value;
    }
    return out;
  });

  return { columns, rows, dtypes: inferSqlDtypes(columns, dtypeRows), index };
}

/**
 * What the screen needs after every run. A table or view named `result` is the
 * player's answer (a join, a reshape, a question's answer): it is judged, and it
 * is returned beside the data table, which is left exactly as the player's code
 * left it. Without a `result`, the data table is what is judged.
 */
function serializeTables(): { resultGrid: ResultGrid; tableGrid?: ResultGrid } {
  const answerExists =
    (db?.exec("SELECT 1 FROM sqlite_master WHERE name = 'result';")[0]?.values.length ??
      0) > 0;
  const table = serializeNamed(TABLE_NAME, "rowid");
  if (!answerExists) return { resultGrid: table };
  return { resultGrid: serializeNamed("result", "sequence"), tableGrid: table };
}

/** Mirrors the Pyodide worker's notebook-style output (stdout + last-expression repr): the last statement's result set if the code ended in a SELECT, or a "rows affected" message for a mutating statement — real SQLite behavior either way, never fabricated. */
function buildOutputTable(
  execResults: { columns: string[]; values: SqlValue[][] }[],
): OutputTable | null {
  const last = execResults[execResults.length - 1];
  if (!last) return null;
  return {
    columns: last.columns,
    rows: last.values
      .slice(0, MAX_OUTPUT_ROWS)
      .map((row) => row.map((cell) => (cell instanceof Uint8Array ? null : cell))),
    totalRows: last.values.length,
  };
}

function buildOutput(
  execResults: { columns: string[]; values: SqlValue[][] }[],
): string | null {
  const last = execResults[execResults.length - 1];
  if (!last) {
    const modified = db?.getRowsModified() ?? 0;
    return modified > 0 ? `${String(modified)} row(s) affected` : null;
  }

  const MAX_PREVIEW_ROWS = 20;
  const lines = [last.columns.join("\t")];
  for (const row of last.values.slice(0, MAX_PREVIEW_ROWS)) {
    lines.push(row.map((cell) => (cell === null ? "NULL" : String(cell))).join("\t"));
  }
  if (last.values.length > MAX_PREVIEW_ROWS) {
    lines.push(`... (${String(last.values.length - MAX_PREVIEW_ROWS)} more rows)`);
  }
  return lines.join("\n");
}

async function handleRequest(request: WorkerRequest): Promise<void> {
  if (request.type === "cancel") {
    // Best-effort only, same reasoning as the Pyodide worker — see
    // EngineRpcClient.cancel() in packages/engine-adapters/src/rpc.ts.
    return;
  }

  await sqlJsReady;

  try {
    let output: string | null = null;
    let outputTable: OutputTable | null = null;
    let elapsedMs: number | null = null;

    if (request.type === "init-case") {
      if (request.generated) {
        await loadGeneratedIntoTable(request.generated, TABLE_NAME);
      } else {
        await loadCsvIntoTable(request.datasetUrl, TABLE_NAME, true, request.datasetText);
      }
      for (const table of request.extraTables ?? []) {
        await loadCsvIntoTable(table.url, table.name, false, table.text);
      }
    } else {
      if (!db) throw new Error("No dataset loaded yet.");
      const startedAt = performance.now();
      const execResults = db.exec(prepareSql(request.code));
      elapsedMs = performance.now() - startedAt;
      outputTable = buildOutputTable(execResults);
      output = outputTable ? null : buildOutput(execResults);
    }

    const { resultGrid, tableGrid } = serializeTables();
    postMessage({
      type: "run-result",
      requestId: request.requestId,
      resultGrid,
      ...(tableGrid ? { tableGrid } : {}),
      output,
      outputTable,
      ...(elapsedMs === null ? {} : { stats: { elapsedMs } }),
    } satisfies RunResultResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    postMessage({
      type: "run-error",
      requestId: request.requestId,
      message,
    } satisfies RunErrorResponse);
  }
}

self.addEventListener("message", (event: MessageEvent<WorkerRequest>) => {
  void handleRequest(event.data);
});
