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

export interface InitCaseRequest {
  type: "init-case";
  requestId: string;
  /** Fetched inside the worker and loaded into the `df` namespace variable. */
  datasetUrl: string;
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

export interface RunResultResponse {
  type: "run-result";
  requestId: string;
  /** Serializable snapshot of the resulting dataframe/table, engine-agnostic. */
  resultGrid: ResultGrid;
  /**
   * Captured stdout (print()) plus the last expression's repr, like a real
   * notebook cell — null when the run produced neither (e.g. a bare
   * assignment). Never fabricated; verbatim from the interpreter.
   */
  output: string | null;
}

export interface RunErrorResponse {
  type: "run-error";
  requestId: string;
  /** The real interpreter error message, surfaced verbatim — never rewritten. */
  message: string;
}

export type WorkerResponse =
  EngineReadyResponse | EngineErrorResponse | RunResultResponse | RunErrorResponse;
