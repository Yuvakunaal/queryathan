import { EngineRpcClient } from "@dcq/engine-adapters";
import type { RunResultResponse } from "@dcq/engine-adapters";

/**
 * Main-thread handle to the Pyodide worker. The worker is spawned lazily —
 * call spawn() only when a boss fight is actually entered (Section 10:
 * lazy-load the engine, never pay its cost on the world map).
 */
export class PyodideClient {
  private worker: Worker | undefined;
  private rpc: EngineRpcClient | undefined;

  spawn(): void {
    if (this.worker) return;
    this.worker = new Worker(new URL("./pyodide.worker.ts", import.meta.url), {
      type: "module",
    });
    this.rpc = new EngineRpcClient(this.worker);
  }

  ready(): Promise<void> {
    if (!this.rpc) throw new Error("PyodideClient.spawn() must be called first");
    return this.rpc.ready();
  }

  initCase(datasetUrl: string): Promise<RunResultResponse> {
    if (!this.rpc) throw new Error("PyodideClient.spawn() must be called first");
    return this.rpc.initCase(datasetUrl);
  }

  run(code: string): Promise<RunResultResponse> {
    if (!this.rpc) throw new Error("PyodideClient.spawn() must be called first");
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
