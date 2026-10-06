import { prepareSandboxCsvWithHints } from "../lib/sandbox";
import { csvToGrid } from "../lib/csvGrid";
import { columnTipsFor } from "../lib/mysqlType";
import type {
  CsvImportRequest,
  CsvImportResponse,
  CsvPreparedResponse,
} from "./csv-import.protocol";

/**
 * Reads the player's CSV off the main thread: decode, delimiter detection, header tidying,
 * limit checks, column hints and re-serialising all happen here, with the same rules and the
 * same messages as the plain functions in lib/sandbox (this file only calls them), so a big file
 * never freezes the page. The file is never sent anywhere.
 */
self.addEventListener("message", (event: MessageEvent<CsvImportRequest>) => {
  const request = event.data;
  try {
    const text =
      request.buffer !== undefined
        ? new TextDecoder("utf-8").decode(request.buffer)
        : (request.text ?? "");
    const result = prepareSandboxCsvWithHints(text);
    const response: CsvPreparedResponse = {
      type: "csv-prepared",
      requestId: request.requestId,
      result,
      ...(request.withTips && result.ok
        ? { tips: columnTipsFor(csvToGrid(result.data.csvText)) }
        : {}),
    };
    postMessage(response satisfies CsvImportResponse);
  } catch (error) {
    postMessage({
      type: "csv-error",
      requestId: request.requestId,
      message: error instanceof Error ? error.message : String(error),
    } satisfies CsvImportResponse);
  }
});
