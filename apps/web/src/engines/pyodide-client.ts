import { WorkerEngineClient } from "@dcq/engine-adapters";

/**
 * The only thing PyodideClient adds over its WorkerEngineClient base is
 * which worker file to spawn — see WorkerEngineClient's doc comment for
 * why that has to live here rather than being passed in generically.
 */
export class PyodideClient extends WorkerEngineClient {
  protected createWorker(): Worker {
    return new Worker(new URL("./pyodide.worker.ts", import.meta.url), {
      type: "module",
    });
  }
}
