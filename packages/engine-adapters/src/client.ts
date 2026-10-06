import { EngineRpcClient } from "./rpc";
import type { EngineStage, RunResultResponse } from "./protocol";
import type { InitCaseOptions } from "./rpc";

/**
 * Main-thread handle shared by every engine (Pyodide, sql.js): lazy-spawn
 * a dedicated Worker on first use (Section 10 — never pay an engine's
 * cost until a fight actually needs it), then delegate everything to
 * EngineRpcClient. Each concrete engine client exists only to supply
 * *which* worker file to spawn — the URL has to be a literal
 * `new URL("./x.worker.ts", import.meta.url)` expression for Vite's
 * static worker-bundling analysis to find it, which is why that
 * expression lives in each engine's own thin subclass rather than being
 * passed in as a runtime string.
 */
export abstract class WorkerEngineClient {
  private worker: Worker | undefined;
  private rpc: EngineRpcClient | undefined;

  protected abstract createWorker(): Worker;

  spawn(): void {
    if (this.worker) return;
    this.worker = this.createWorker();
    const rpc = new EngineRpcClient(this.worker);
    this.rpc = rpc;
    // A worker whose script cannot be loaded never says anything; the browser reports it here.
    this.worker.addEventListener("error", (event) => {
      rpc.fail(event.message || "The engine could not be loaded.");
    });
  }

  ready(): Promise<void> {
    if (!this.rpc) throw new Error("spawn() must be called before ready()");
    return this.rpc.ready();
  }

  /** Start-up steps as the engine reaches them (Python only; SQL starts in one step). Returns the unsubscribe function. */
  onProgress(listener: (stage: EngineStage) => void): () => void {
    return this.rpc?.onProgress(listener) ?? (() => undefined);
  }

  initCase(
    datasetUrl: string,
    options: InitCaseOptions = {},
  ): Promise<RunResultResponse> {
    if (!this.rpc) throw new Error("spawn() must be called before initCase()");
    return this.rpc.initCase(datasetUrl, options);
  }

  run(code: string): Promise<RunResultResponse> {
    if (!this.rpc) throw new Error("spawn() must be called before run()");
    return this.rpc.run(code);
  }

  cancel(requestId: string): void {
    this.rpc?.cancel(requestId);
  }

  terminate(): void {
    this.rpc?.dispose();
    this.worker?.terminate();
    this.worker = undefined;
    this.rpc = undefined;
  }
}
