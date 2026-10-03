import { EngineRpcClient } from "./rpc";
import type { RunResultResponse } from "./protocol";

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
    this.rpc = new EngineRpcClient(this.worker);
  }

  ready(): Promise<void> {
    if (!this.rpc) throw new Error("spawn() must be called before ready()");
    return this.rpc.ready();
  }

  initCase(datasetUrl: string): Promise<RunResultResponse> {
    if (!this.rpc) throw new Error("spawn() must be called before initCase()");
    return this.rpc.initCase(datasetUrl);
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
