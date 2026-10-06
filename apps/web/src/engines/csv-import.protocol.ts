import type { SandboxResult } from "../lib/sandbox";
import type { ColumnTip } from "../lib/mysqlType";

/**
 * Messages between the main thread and the CSV import worker. Same shape as the engine
 * protocol (packages/engine-adapters): every request carries a requestId and exactly one
 * response comes back with the same id.
 */

/** Read, validate and tidy one CSV. The file's bytes are transferred (not copied); pasted text is sent as a string. */
export interface PrepareCsvRequest {
  type: "prepare-csv";
  requestId: string;
  /** Exactly one of these is set. */
  buffer?: ArrayBuffer;
  text?: string;
  /** Also work out the column tooltips (for a table added beside the main one). */
  withTips: boolean;
}

export type CsvImportRequest = PrepareCsvRequest;

/** The same result the main-thread function returns, plus the tooltips when they were asked for. */
export interface CsvPreparedResponse {
  type: "csv-prepared";
  requestId: string;
  result: SandboxResult;
  tips?: Record<string, ColumnTip>;
}

/** The worker itself failed (not a problem with the file: those come back inside `result`). */
export interface CsvImportErrorResponse {
  type: "csv-error";
  requestId: string;
  message: string;
}

export type CsvImportResponse = CsvPreparedResponse | CsvImportErrorResponse;
