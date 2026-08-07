/**
 * The one place the main thread and a Pyodide/sql.js worker agree on message
 * shape. Both sides import this — never redeclare it independently.
 */

export interface RunCodeRequest {
  type: "run-code";
  requestId: string;
  code: string;
}

export interface CancelRequest {
  type: "cancel";
  requestId: string;
}

export type WorkerRequest = RunCodeRequest | CancelRequest;

export interface EngineReadyResponse {
  type: "ready";
}

export interface RunResultResponse {
  type: "run-result";
  requestId: string;
  /** Serializable snapshot of the resulting dataframe/table, engine-agnostic. */
  resultGrid: {
    columns: string[];
    rows: Record<string, string | number | boolean | null>[];
  };
}

export interface RunErrorResponse {
  type: "run-error";
  requestId: string;
  /** The real interpreter error message, surfaced verbatim — never rewritten. */
  message: string;
}

export type WorkerResponse = EngineReadyResponse | RunResultResponse | RunErrorResponse;
