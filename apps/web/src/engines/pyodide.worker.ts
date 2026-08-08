import { loadPyodide, type PyodideInterface } from "pyodide";
import type {
  EngineErrorResponse,
  EngineReadyResponse,
  ResultGrid,
  RunErrorResponse,
  RunResultResponse,
  WorkerRequest,
} from "@dcq/engine-adapters";

/**
 * pyodide-core (self-hosted, see scripts/fetch-pyodide.mjs) ships the
 * interpreter + stdlib only — its own pyodide-lock.json lists pandas but the
 * wheel isn't bundled. Fetching the full ~400MB distribution just to
 * self-host five wheels isn't practical for a lazy-loaded web game, so those
 * five are loaded by direct URL from Pyodide's official jsdelivr mirror at
 * the exact pinned version (immutable, versioned path — never @latest).
 * loadPackage() skips dependency resolution for direct-URL entries, so every
 * transitive dependency is listed explicitly. Documented in
 * docs/adr/0004-pyodide-package-delivery.md; the CSP connect-src exception
 * lives in vercel.json.
 */
const PYODIDE_VERSION = "314.0.4";
const PACKAGE_CDN_BASE = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full`;
const RUNTIME_WHEELS = [
  "numpy-2.4.3-cp314-cp314-pyemscripten_2026_0_wasm32.whl",
  "python_dateutil-2.9.0.post0-py2.py3-none-any.whl",
  "pytz-2026.1.post1-py2.py3-none-any.whl",
  "six-1.17.0-py2.py3-none-any.whl",
  "pandas-3.0.2-cp314-cp314-pyemscripten_2026_0_wasm32.whl",
].map((fileName) => `${PACKAGE_CDN_BASE}/${fileName}`);

const SERIALIZE_HELPER_PY = `
import json

def __dcq_serialize_df(dataframe):
    columns = list(dataframe.columns)
    rows = json.loads(dataframe.to_json(orient="records"))
    dtypes = {col: str(dtype) for col, dtype in dataframe.dtypes.items()}
    index = dataframe.index.tolist()
    return json.dumps({"columns": columns, "rows": rows, "dtypes": dtypes, "index": index})
`;

let stdoutBuffer: string[] = [];

async function initPyodide(): Promise<PyodideInterface> {
  const pyodide = await loadPyodide({
    indexURL: "/pyodide/",
    // .toString() on a PyProxy returns repr(o) instead of str(o) — matches
    // what a real REPL/notebook cell echoes for a bare expression.
    pyproxyToStringRepr: true,
  });
  await pyodide.loadPackage(RUNTIME_WHEELS);
  await pyodide.runPythonAsync(SERIALIZE_HELPER_PY);
  pyodide.setStdout({
    batched: (line: string) => {
      stdoutBuffer.push(line);
    },
  });
  return pyodide;
}

const pyodideReady = initPyodide();

pyodideReady
  .then(() => {
    postMessage({ type: "ready" } satisfies EngineReadyResponse);
  })
  .catch((error: unknown) => {
    // Nothing has a requestId yet at boot — post an engine-level error so
    // EngineRpcClient.ready() rejects instead of hanging forever, and log
    // it too since the message alone may not carry a full stack.
    console.error("Pyodide failed to initialize:", error);
    const message = error instanceof Error ? error.message : String(error);
    postMessage({ type: "engine-error", message } satisfies EngineErrorResponse);
  });

function serializeDataframe(pyodide: PyodideInterface): ResultGrid {
  const json = pyodide.runPython("__dcq_serialize_df(df)") as string;
  return JSON.parse(json) as ResultGrid;
}

interface DestroyablePyProxy {
  destroy(): void;
}

function isDestroyable(value: unknown): value is DestroyablePyProxy {
  return (
    typeof value === "object" &&
    value !== null &&
    "destroy" in value &&
    typeof value.destroy === "function"
  );
}

/**
 * Notebook-style output: captured print() lines plus the last expression's
 * repr (pyproxyToStringRepr: true makes PyProxy.toString() return repr(o)
 * rather than str(o) — matches what a real REPL echoes for a bare
 * expression). null when there's genuinely nothing to show, e.g. a run that
 * ends in an assignment.
 */
function buildOutput(stdoutLines: string[], replValue: unknown): string | null {
  const parts = [...stdoutLines];

  if (replValue !== undefined && replValue !== null) {
    // Safe: primitives stringify normally, and PyProxy.toString() is repr(o)
    // (pyproxyToStringRepr: true) — never the bare Object default.
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    parts.push(String(replValue));
    if (isDestroyable(replValue)) replValue.destroy();
  }

  return parts.length > 0 ? parts.join("\n") : null;
}

async function handleRequest(request: WorkerRequest): Promise<void> {
  if (request.type === "cancel") {
    // Best-effort only — see EngineRpcClient.cancel() in
    // packages/engine-adapters/src/rpc.ts for why real interruption isn't
    // available without SharedArrayBuffer + cross-origin isolation.
    return;
  }

  const pyodide = await pyodideReady;
  stdoutBuffer = [];

  try {
    let replValue: unknown;

    if (request.type === "init-case") {
      const response = await fetch(request.datasetUrl);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch dataset: ${String(response.status)} ${response.statusText}`,
        );
      }
      const csvText = await response.text();
      // Pyodide's PyProxy.set() is untyped (any) in its own .d.ts — third-party limitation.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      pyodide.globals.set("__dcq_csv_text", csvText);
      await pyodide.runPythonAsync(
        "import pandas as pd, io\ndf = pd.read_csv(io.StringIO(__dcq_csv_text))",
      );
    } else {
      replValue = await pyodide.runPythonAsync(request.code);
    }

    const resultGrid = serializeDataframe(pyodide);
    postMessage({
      type: "run-result",
      requestId: request.requestId,
      resultGrid,
      output: buildOutput(stdoutBuffer, replValue),
    } satisfies RunResultResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    postMessage({
      type: "run-error",
      requestId: request.requestId,
      message,
    } satisfies RunErrorResponse);
  }
}

self.addEventListener("message", (event: MessageEvent<WorkerRequest>) => {
  void handleRequest(event.data);
});
