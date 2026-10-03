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
  RunErrorResponse,
  RunResultResponse,
  WorkerRequest,
} from "@dcq/engine-adapters";
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

async function loadCsvIntoTable(datasetUrl: string): Promise<void> {
  const SQL = await sqlJsReady;
  const response = await fetch(datasetUrl);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch dataset: ${String(response.status)} ${response.statusText}`,
    );
  }
  const csvText = await response.text();
  const { columns, rows } = parseCsv(csvText);
  const columnTypes = inferColumnTypes(columns, rows);

  db?.close();
  db = new SQL.Database();

  const createColumns = columns.map((column) => quoteIdentifier(column)).join(", ");
  db.run(`CREATE TABLE ${TABLE_NAME} (${createColumns});`);

  const placeholders = columns.map(() => "?").join(", ");
  const insertColumns = columns.map((column) => quoteIdentifier(column)).join(", ");
  const stmt = db.prepare(
    `INSERT INTO ${TABLE_NAME} (${insertColumns}) VALUES (${placeholders});`,
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

function serializeTable(): ResultGrid {
  if (!db) throw new Error("No dataset loaded yet.");
  const result = db.exec(
    `SELECT rowid AS ${ROW_ID_ALIAS}, * FROM ${TABLE_NAME} ORDER BY rowid;`,
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

/** Mirrors the Pyodide worker's notebook-style output (stdout + last-expression repr): the last statement's result set if the code ended in a SELECT, or a "rows affected" message for a mutating statement — real SQLite behavior either way, never fabricated. */
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

    if (request.type === "init-case") {
      await loadCsvIntoTable(request.datasetUrl);
    } else {
      if (!db) throw new Error("No dataset loaded yet.");
      const execResults = db.exec(request.code);
      output = buildOutput(execResults);
    }

    const resultGrid = serializeTable();
    postMessage({
      type: "run-result",
      requestId: request.requestId,
      resultGrid,
      output,
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
