import { describe, expect, it, vi } from "vitest";
import { EngineRpcClient, RpcRunError, RpcTimeoutError } from "./rpc";
import type { RpcTransport } from "./rpc";
import type { WorkerRequest, WorkerResponse } from "./protocol";

class FakeTransport implements RpcTransport {
  sent: WorkerRequest[] = [];
  private listeners: ((event: MessageEvent<WorkerResponse>) => void)[] = [];

  postMessage(message: WorkerRequest): void {
    this.sent.push(message);
  }

  addEventListener(
    _type: "message",
    listener: (event: MessageEvent<WorkerResponse>) => void,
  ): void {
    this.listeners.push(listener);
  }

  removeEventListener(
    _type: "message",
    listener: (event: MessageEvent<WorkerResponse>) => void,
  ): void {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  emit(response: WorkerResponse): void {
    for (const listener of this.listeners) {
      listener({ data: response } as MessageEvent<WorkerResponse>);
    }
  }
}

const sampleGrid = {
  columns: ["a"],
  rows: [{ a: 1 }],
  dtypes: { a: "int64" },
  index: [0],
};

describe("EngineRpcClient", () => {
  it("resolves ready() once a ready message arrives", async () => {
    const transport = new FakeTransport();
    const client = new EngineRpcClient(transport);
    const readyPromise = client.ready();
    transport.emit({ type: "ready" });
    await expect(readyPromise).resolves.toBeUndefined();
  });

  it("ready() resolves immediately if already ready", async () => {
    const transport = new FakeTransport();
    const client = new EngineRpcClient(transport);
    transport.emit({ type: "ready" });
    await expect(client.ready()).resolves.toBeUndefined();
  });

  it("correlates run() with a matching run-result response", async () => {
    const transport = new FakeTransport();
    const client = new EngineRpcClient(transport);

    const runPromise = client.run("df.fillna(0)");
    const sent = transport.sent[0];
    expect(sent?.type).toBe("run-code");
    if (sent?.type !== "run-code") throw new Error("expected run-code");

    transport.emit({
      type: "run-result",
      requestId: sent.requestId,
      resultGrid: sampleGrid,
      output: null,
    });
    await expect(runPromise).resolves.toEqual({
      type: "run-result",
      requestId: sent.requestId,
      resultGrid: sampleGrid,
      output: null,
    });
  });

  it("rejects with RpcRunError carrying the verbatim interpreter message on run-error", async () => {
    const transport = new FakeTransport();
    const client = new EngineRpcClient(transport);

    const runPromise = client.run("1/0");
    const sent = transport.sent[0];
    if (sent?.type !== "run-code") throw new Error("expected run-code");

    transport.emit({
      type: "run-error",
      requestId: sent.requestId,
      message: "ZeroDivisionError: division by zero",
    });

    await expect(runPromise).rejects.toBeInstanceOf(RpcRunError);
    await expect(runPromise).rejects.toThrow("ZeroDivisionError: division by zero");
  });

  it("ignores a response whose requestId does not match any pending request", async () => {
    const transport = new FakeTransport();
    const client = new EngineRpcClient(transport);

    const runPromise = client.run("df.fillna(0)");
    transport.emit({
      type: "run-result",
      requestId: "unrelated-id",
      resultGrid: sampleGrid,
      output: null,
    });

    // Still pending — no matching request was resolved.
    let settled = false;
    void runPromise.then(() => {
      settled = true;
    });
    await Promise.resolve();
    expect(settled).toBe(false);
  });

  it("rejects with RpcTimeoutError and sends a cancel when the worker never responds", async () => {
    vi.useFakeTimers();
    try {
      const transport = new FakeTransport();
      const client = new EngineRpcClient(transport);

      const runPromise = client.run("df.fillna(0)", 1000);
      const rejection = expect(runPromise).rejects.toBeInstanceOf(RpcTimeoutError);
      await vi.advanceTimersByTimeAsync(1000);
      await rejection;

      const cancelSent = transport.sent.find((m) => m.type === "cancel");
      expect(cancelSent).toBeDefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it("cancel() removes the pending request and posts a cancel message", async () => {
    const transport = new FakeTransport();
    const client = new EngineRpcClient(transport);

    const runPromise = client.run("df.fillna(0)");
    const sent = transport.sent[0];
    if (sent?.type !== "run-code") throw new Error("expected run-code");

    client.cancel(sent.requestId);
    expect(
      transport.sent.some((m) => m.type === "cancel" && m.requestId === sent.requestId),
    ).toBe(true);

    // A late response after cancel should not resolve the already-abandoned promise.
    transport.emit({
      type: "run-result",
      requestId: sent.requestId,
      resultGrid: sampleGrid,
      output: null,
    });
    let settled = false;
    void runPromise.then(() => {
      settled = true;
    });
    await Promise.resolve();
    expect(settled).toBe(false);
  });

  it("initCase() sends an init-case request and resolves via run-result", async () => {
    const transport = new FakeTransport();
    const client = new EngineRpcClient(transport);

    const initPromise = client.initCase("/datasets/world-1/tutorial-nulls.csv");
    const sent = transport.sent[0];
    expect(sent?.type).toBe("init-case");
    if (sent?.type !== "init-case") throw new Error("expected init-case");
    expect(sent.datasetUrl).toBe("/datasets/world-1/tutorial-nulls.csv");

    transport.emit({
      type: "run-result",
      requestId: sent.requestId,
      resultGrid: sampleGrid,
      output: null,
    });
    await expect(initPromise).resolves.toEqual({
      type: "run-result",
      requestId: sent.requestId,
      resultGrid: sampleGrid,
      output: null,
    });
  });
});
