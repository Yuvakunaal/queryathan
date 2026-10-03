import type {
  ExtraTable,
  RunResultResponse,
  WorkerRequest,
  WorkerResponse,
} from "./protocol";

export interface InitCaseOptions {
  extraTables?: ExtraTable[];
  trackRowIdentity?: boolean;
}

/**
 * Minimal Worker-shaped interface so this can be unit-tested with an
 * in-memory fake instead of a real Worker/jsdom.
 */
export interface RpcTransport {
  postMessage(message: WorkerRequest): void;
  addEventListener(
    type: "message",
    listener: (event: MessageEvent<WorkerResponse>) => void,
  ): void;
  removeEventListener(
    type: "message",
    listener: (event: MessageEvent<WorkerResponse>) => void,
  ): void;
}

export class RpcTimeoutError extends Error {
  constructor(requestId: string) {
    super(`Worker did not respond to request ${requestId} in time`);
    this.name = "RpcTimeoutError";
  }
}

export class RpcRunError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RpcRunError";
  }
}

/** The engine (Pyodide) itself failed to start — never resolves ready(). */
export class RpcEngineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RpcEngineError";
  }
}

interface PendingRequest {
  resolve: (response: RunResultResponse) => void;
  reject: (error: Error) => void;
  timeoutHandle: ReturnType<typeof setTimeout>;
}

interface ReadyWaiter {
  resolve: () => void;
  reject: (error: Error) => void;
  timeoutHandle: ReturnType<typeof setTimeout>;
}

const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_READY_TIMEOUT_MS = 45_000;

/** Local request-correlation ID — uniqueness within a session is all that's needed. */
function generateRequestId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Correlates requests sent to a Pyodide/sql.js worker with their responses.
 * Both `init-case` and `run-code` resolve through the same `run-result` /
 * `run-error` response pair — structurally identical from the caller's side.
 */
export class EngineRpcClient {
  private transport: RpcTransport;
  private pending = new Map<string, PendingRequest>();
  private readyWaiters: ReadyWaiter[] = [];
  private isReady = false;
  private engineError: RpcEngineError | null = null;
  private listener: (event: MessageEvent<WorkerResponse>) => void;

  constructor(transport: RpcTransport) {
    this.transport = transport;
    this.listener = (event) => {
      this.handleMessage(event.data);
    };
    this.transport.addEventListener("message", this.listener);
  }

  /**
   * Rejects if the engine never posts `ready` within timeoutMs, or if it
   * posts `engine-error` (e.g. Pyodide/package load failure) — either way
   * the caller gets a real error to show instead of hanging on a blank
   * screen forever.
   */
  ready(timeoutMs = DEFAULT_READY_TIMEOUT_MS): Promise<void> {
    if (this.isReady) return Promise.resolve();
    if (this.engineError) return Promise.reject(this.engineError);

    return new Promise((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        this.readyWaiters = this.readyWaiters.filter((w) => w.resolve !== resolve);
        reject(new RpcTimeoutError("engine-ready"));
      }, timeoutMs);
      this.readyWaiters.push({ resolve, reject, timeoutHandle });
    });
  }

  initCase(
    datasetUrl: string,
    options: InitCaseOptions = {},
    timeoutMs = DEFAULT_TIMEOUT_MS,
  ): Promise<RunResultResponse> {
    return this.send(
      {
        type: "init-case",
        datasetUrl,
        extraTables: options.extraTables ?? [],
        trackRowIdentity: options.trackRowIdentity ?? true,
      },
      timeoutMs,
    );
  }

  run(code: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<RunResultResponse> {
    return this.send({ type: "run-code", code }, timeoutMs);
  }

  /**
   * Best-effort only: Pyodide has no in-flight interrupt without
   * SharedArrayBuffer + cross-origin isolation, which conflicts with the
   * simpler CSP posture from docs/adr/0002-hosting.md. This stops the
   * client from acting on a late response — it does not stop the worker
   * from finishing the computation it already started.
   */
  cancel(requestId: string): void {
    const pending = this.pending.get(requestId);
    if (!pending) return;
    clearTimeout(pending.timeoutHandle);
    this.pending.delete(requestId);
    this.transport.postMessage({ type: "cancel", requestId });
  }

  dispose(): void {
    this.transport.removeEventListener("message", this.listener);
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timeoutHandle);
    }
    this.pending.clear();
    for (const waiter of this.readyWaiters) {
      clearTimeout(waiter.timeoutHandle);
    }
    this.readyWaiters = [];
  }

  private send(
    request:
      | {
          type: "init-case";
          datasetUrl: string;
          extraTables: ExtraTable[];
          trackRowIdentity: boolean;
        }
      | { type: "run-code"; code: string },
    timeoutMs: number,
  ): Promise<RunResultResponse> {
    const requestId = generateRequestId();
    return new Promise((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        this.pending.delete(requestId);
        this.transport.postMessage({ type: "cancel", requestId });
        reject(new RpcTimeoutError(requestId));
      }, timeoutMs);

      this.pending.set(requestId, { resolve, reject, timeoutHandle });
      this.transport.postMessage({ ...request, requestId });
    });
  }

  private handleMessage(response: WorkerResponse): void {
    if (response.type === "ready") {
      this.isReady = true;
      for (const waiter of this.readyWaiters) {
        clearTimeout(waiter.timeoutHandle);
        waiter.resolve();
      }
      this.readyWaiters = [];
      return;
    }

    if (response.type === "engine-error") {
      this.engineError = new RpcEngineError(response.message);
      for (const waiter of this.readyWaiters) {
        clearTimeout(waiter.timeoutHandle);
        waiter.reject(this.engineError);
      }
      this.readyWaiters = [];
      return;
    }

    const pending = this.pending.get(response.requestId);
    if (!pending) return;
    clearTimeout(pending.timeoutHandle);
    this.pending.delete(response.requestId);

    if (response.type === "run-result") {
      pending.resolve(response);
    } else {
      pending.reject(new RpcRunError(response.message));
    }
  }
}
