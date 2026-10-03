import { WorkerEngineClient } from "@dcq/engine-adapters";

/** The SQL-engine twin of PyodideClient — same WorkerEngineClient base, just a different worker file. */
export class SqliteClient extends WorkerEngineClient {
  protected createWorker(): Worker {
    return new Worker(new URL("./sqlite.worker.ts", import.meta.url), { type: "module" });
  }
}
