import { oversizeFileMessage, prepareSandboxCsvWithHints } from "../lib/sandbox";
import type { SandboxResult } from "../lib/sandbox";
import type { ColumnTip } from "../lib/mysqlType";
import type { CsvImportRequest, CsvImportResponse } from "./csv-import.protocol";

export interface PreparedCsv {
  result: SandboxResult;
  /** Column tooltips, present when they were asked for and the file was accepted. */
  tips?: Record<string, ColumnTip>;
}

interface Pending {
  resolve: (value: PreparedCsv) => void;
  reject: (error: Error) => void;
  timeoutHandle: ReturnType<typeof setTimeout>;
}

const IMPORT_TIMEOUT_MS = 60_000;

function requestId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Main-thread handle to the CSV import worker: spawned on first use, so the home page never
 * pays for it. If a worker cannot be started (an old browser, a blocked worker) every call falls
 * back to the same functions on the main thread, so importing still works, only without the
 * off-thread benefit. Call dispose() when the screen that owns it goes away.
 */
export class CsvImportClient {
  private worker: Worker | undefined;
  private broken = false;
  private pending = new Map<string, Pending>();

  /**
   * Reads one upload (a File, or pasted/fetched text) and returns the same result the plain
   * function returns. A File's size is checked before any of it is read; its bytes are handed to
   * the worker without being copied.
   */
  async prepare(
    source: File | string,
    options: { withTips?: boolean } = {},
  ): Promise<PreparedCsv> {
    const withTips = options.withTips ?? false;
    if (typeof source !== "string") {
      const tooBig = oversizeFileMessage(source.size);
      if (tooBig !== null) return { result: { ok: false, message: tooBig } };
    }
    const worker = this.ensureWorker();
    if (!worker) return this.onMainThread(source, withTips);

    const id = requestId();
    if (typeof source === "string") {
      return this.send(worker, {
        type: "prepare-csv",
        requestId: id,
        text: source,
        withTips,
      });
    }
    const buffer = await source.arrayBuffer();
    return this.send(worker, { type: "prepare-csv", requestId: id, buffer, withTips }, [
      buffer,
    ]);
  }

  dispose(): void {
    this.worker?.terminate();
    this.worker = undefined;
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timeoutHandle);
      pending.reject(new Error("The import was cancelled."));
    }
    this.pending.clear();
  }

  private ensureWorker(): Worker | undefined {
    if (this.broken || typeof Worker === "undefined") return undefined;
    if (this.worker) return this.worker;
    try {
      const worker = new Worker(new URL("./csv-import.worker.ts", import.meta.url), {
        type: "module",
      });
      worker.addEventListener("message", (event: MessageEvent<CsvImportResponse>) => {
        this.handle(event.data);
      });
      worker.addEventListener("error", () => {
        // The worker could not start or crashed: finish what is waiting on the main thread.
        this.broken = true;
        this.worker?.terminate();
        this.worker = undefined;
        const waiting = [...this.pending.values()];
        this.pending.clear();
        for (const pending of waiting) {
          clearTimeout(pending.timeoutHandle);
          pending.reject(new Error("The import worker failed."));
        }
      });
      this.worker = worker;
      return worker;
    } catch {
      this.broken = true;
      return undefined;
    }
  }

  private send(
    worker: Worker,
    request: CsvImportRequest,
    transfer: Transferable[] = [],
  ): Promise<PreparedCsv> {
    return new Promise((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        this.pending.delete(request.requestId);
        reject(new Error("The import took too long."));
      }, IMPORT_TIMEOUT_MS);
      this.pending.set(request.requestId, { resolve, reject, timeoutHandle });
      worker.postMessage(request, transfer);
    });
  }

  private handle(response: CsvImportResponse): void {
    const pending = this.pending.get(response.requestId);
    if (!pending) return;
    clearTimeout(pending.timeoutHandle);
    this.pending.delete(response.requestId);
    if (response.type === "csv-prepared") {
      pending.resolve({
        result: response.result,
        ...(response.tips ? { tips: response.tips } : {}),
      });
    } else {
      pending.reject(new Error(response.message));
    }
  }

  private async onMainThread(
    source: File | string,
    withTips: boolean,
  ): Promise<PreparedCsv> {
    const text = typeof source === "string" ? source : await source.text();
    const result = prepareSandboxCsvWithHints(text);
    if (!withTips || !result.ok) return { result };
    const [{ csvToGrid }, { columnTipsFor }] = await Promise.all([
      import("../lib/csvGrid"),
      import("../lib/mysqlType"),
    ]);
    return { result, tips: columnTipsFor(csvToGrid(result.data.csvText)) };
  }
}
