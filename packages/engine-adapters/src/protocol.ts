import type { GeneratedDataset } from "./generate";

/**
 * The one place the main thread and a Pyodide/sql.js worker agree on message
 * shape. Both sides import this — never redeclare it independently.
 */

export interface ResultGrid {
  columns: string[];
  rows: Record<string, string | number | boolean | null>[];
  /** Each column's real pandas dtype (`str(dataframe[col].dtype)`) — e.g. "int64", "float64", "object", "datetime64[ns]". */
  dtypes: Record<string, string>;
  /**
   * A stable per-row identity value, in display order — an engine-assigned
   * value independent of both array position and the underlying engine's
   * own row index/rowid, so it survives operations a player might run that
   * would otherwise reset it (e.g. pandas' `.reset_index(drop=True)`, the
   * idiomatic follow-up to `drop_duplicates()`). This is what lets a
   * row-count-changing run be diffed by row identity instead of position
   * (lib/diff.ts) — see docs/adr/0006-row-identity-diffing.md.
   */
  index: (string | number)[];
}

/** An additional CSV loaded beside the main dataset: a pandas DataFrame named `name` in Python, a table named `name` in SQL. */
export interface ExtraTable {
  name: string;
  url: string;
  /** The CSV text itself, when it comes from the player's own files (the sandbox) and there is nothing to fetch. */
  text?: string;
}

/** A query's returned table (a SELECT result, or a DataFrame/Series the last expression evaluated to). Capped for display. */
export interface OutputTable {
  columns: string[];
  rows: (string | number | boolean | null)[][];
  /** Rows the query actually produced; `rows` holds at most the first MAX_OUTPUT_ROWS of them. */
  totalRows: number;
}

export const MAX_OUTPUT_ROWS = 200;

export interface RunStats {
  elapsedMs: number;
}

export interface InitCaseRequest {
  type: "init-case";
  requestId: string;
  /** Fetched inside the worker and loaded into the `df` namespace variable. */
  datasetUrl: string;
  /** When present, the engine loads this CSV text instead of fetching `datasetUrl` (sandbox mode: the player's own file, which never leaves the browser). */
  datasetText?: string;
  /** When present, the engine builds the table from this recipe instead of loading a file (World 5 stress tests). */
  generated?: GeneratedDataset;
  /** Optional reference tables (World 3 joins). The main dataset stays `df` / `data`. */
  extraTables?: ExtraTable[];
  /**
   * Python only. When true (default) a hidden column carries each row's identity through
   * the player's code for diffing. Reshaping cases (melt, pivot) turn it off, because that
   * column would itself be reshaped; identity then falls back to row position.
   */
  trackRowIdentity?: boolean;
}

export interface RunCodeRequest {
  type: "run-code";
  requestId: string;
  code: string;
}

export interface CancelRequest {
  type: "cancel";
  requestId: string;
}

export type WorkerRequest = InitCaseRequest | RunCodeRequest | CancelRequest;

export interface EngineReadyResponse {
  type: "ready";
}

/** Posted if the engine fails to initialize (e.g. Pyodide/package load failure). */
export interface EngineErrorResponse {
  type: "engine-error";
  message: string;
}

/** Where an engine is in its start-up, so the screen can say what it is waiting for (Python takes several steps). */
export type EngineStage = "runtime" | "packages" | "pandas";

export interface EngineProgressResponse {
  type: "engine-progress";
  stage: EngineStage;
}

export interface RunResultResponse {
  type: "run-result";
  requestId: string;
  /** Serializable snapshot of the resulting dataframe/table, engine-agnostic. */
  /** The table the case is judged on: the player's `result` table in SQL when there is one, otherwise their data. */
  resultGrid: ResultGrid;
  /** Present only when `resultGrid` is the answer table: the player's data table itself, which stays as it is. */
  tableGrid?: ResultGrid;
  /**
   * Captured stdout (print()) plus the last expression's repr, like a real
   * notebook cell — null when the run produced neither (e.g. a bare
   * assignment). Never fabricated; verbatim from the interpreter.
   */
  output: string | null;
  /** Present when the run produced a table the player should see as a table (SELECT, DataFrame, Series). `output` then omits that table's text form. */
  outputTable?: OutputTable | null;
  /** How long the player's code took, measured inside the worker around the run only (not loading, not serializing the table). */
  stats?: RunStats;
}

export interface RunErrorResponse {
  type: "run-error";
  requestId: string;
  /** The real interpreter error message, surfaced verbatim — never rewritten. */
  message: string;
}

export type WorkerResponse =
  | EngineReadyResponse
  | EngineProgressResponse
  | EngineErrorResponse
  | RunResultResponse
  | RunErrorResponse;
