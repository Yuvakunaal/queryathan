import { loadPyodide, type PyodideInterface } from "pyodide";
import { MAX_OUTPUT_ROWS, pythonGenerateSource } from "@dcq/engine-adapters";
import type {
  EngineErrorResponse,
  EngineReadyResponse,
  OutputTable,
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

/**
 * Row identity for diffing (lib/diff.ts, lib/affliction-cells.ts#clearedCells,
 * docs/adr/0006-row-identity-diffing.md): which row in the new table is which
 * row in the old one. It used to be a hidden data column, but a column that
 * is not the player's is visible to every pandas call: it makes every row
 * unique (so plain df.drop_duplicates() removed nothing), it appears in
 * df.columns, df.shape, df.to_csv() and df.isna().sum(), and melt() reshaped
 * it into the data. So identity is now kept entirely outside the DataFrame,
 * and the player's df is exactly what they loaded.
 *
 * After each run the engine decides each row's id:
 *   1. Same index labels as before: same ids.
 *   2. Labels are a subset of the old ones and most rows still hold the same
 *      values under them (dropna, filters, sort without reset): ids by label.
 *   3. Otherwise (reset_index(drop=True), merge): rows are matched by their
 *      content, first occurrence first, which is what drop_duplicates keeps.
 *      A leftover changed row falls back to its position, else a fresh id.
 */
const SERIALIZE_HELPER_PY = `
import json
from collections import defaultdict, deque

__dcq_track_row_ids = True
__dcq_state = {"ids": None, "labels": None, "frame": None, "next": 0}

def __dcq_reset_state():
    __dcq_state.update({"ids": None, "labels": None, "frame": None, "next": 0})

def __dcq_rows(frame, cols):
    if not cols:
        return [()] * len(frame)
    sub = frame[cols].astype(object)
    sub = sub.where(sub.notna(), None)
    return list(zip(*[sub[c].tolist() for c in cols]))

def __dcq_assign_ids(df):
    n = len(df)
    state = __dcq_state
    if not __dcq_track_row_ids or not df.columns.is_unique:
        return list(range(n))
    prev = state["frame"]
    if state["ids"] is None or prev is None:
        ids = list(range(n))
        state["next"] = n
    else:
        labels = list(df.index)
        if labels == state["labels"]:
            ids = list(state["ids"])
        else:
            ids = None
            common = [c for c in df.columns if c in prev.columns]
            cur_rows = __dcq_rows(df, common)
            old_rows = __dcq_rows(prev, common)
            if df.index.is_unique and prev.index.is_unique:
                pos = {label: i for i, label in enumerate(state["labels"])}
                if all(label in pos for label in labels):
                    same = sum(1 for i, label in enumerate(labels) if cur_rows[i] == old_rows[pos[label]])
                    if n == 0 or same / n >= 0.5:
                        ids = [state["ids"][pos[label]] for label in labels]
            if ids is None:
                queues = defaultdict(deque)
                for i, row in enumerate(old_rows):
                    queues[row].append(state["ids"][i])
                ids = [queues[row].popleft() if queues.get(row) else None for row in cur_rows]
                used = {i for i in ids if i is not None}
                fresh = state["next"]
                for i, value in enumerate(ids):
                    if value is not None:
                        continue
                    candidate = state["ids"][i] if n == len(state["ids"]) and i < len(state["ids"]) else None
                    if candidate is not None and candidate not in used:
                        ids[i] = candidate
                        used.add(candidate)
                    else:
                        ids[i] = fresh
                        used.add(fresh)
                        fresh += 1
    state["ids"] = ids
    state["labels"] = list(df.index)
    state["frame"] = df.copy()
    state["next"] = max(state["next"], (max(ids) + 1) if ids else 0)
    return ids

def __dcq_table_of(obj):
    import pandas as pd
    if isinstance(obj, pd.Series):
        obj = obj.to_frame(name=obj.name if obj.name is not None else "value")
    if not isinstance(obj, pd.DataFrame):
        return None
    total = len(obj)
    frame = obj.head(${String(MAX_OUTPUT_ROWS)})
    if not isinstance(frame.index, pd.RangeIndex):
        try:
            frame = frame.reset_index()
        except ValueError:
            frame = frame.reset_index(drop=True)
    frame.columns = [" ".join(str(part) for part in col) if isinstance(col, tuple) else str(col) for col in frame.columns]
    parsed = json.loads(frame.to_json(orient="split", date_format="iso"))
    return json.dumps({"columns": parsed["columns"], "rows": parsed["data"], "totalRows": total})

def __dcq_serialize_df(dataframe):
    try:
        row_ids = __dcq_assign_ids(dataframe)
    except Exception:
        row_ids = list(range(len(dataframe)))
    columns = list(dataframe.columns)
    rows = json.loads(dataframe.to_json(orient="records", date_format="iso"))
    dtypes = {col: str(dtype) for col, dtype in dataframe.dtypes.items()}
    return json.dumps({"columns": columns, "rows": rows, "dtypes": dtypes, "index": row_ids})
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
  // Importing pandas takes over a second the first time, so do it during startup
  // (while a warmed-up engine is idle) rather than when the table is first loaded.
  await pyodide.runPythonAsync("import numpy, pandas");
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

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch dataset: ${String(response.status)} ${response.statusText}`,
    );
  }
  return response.text();
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
    let outputTable: OutputTable | null = null;
    let elapsedMs: number | null = null;

    if (request.type === "init-case") {
      if (request.generated) {
        // A stress-test table built from closed-form recipes (World 5), identical to the SQL side's.
        await pyodide.runPythonAsync(
          `import io\n${pythonGenerateSource(request.generated)}`,
        );
      } else {
        const csvText = request.datasetText ?? (await fetchText(request.datasetUrl));
        // Pyodide's PyProxy.set() is untyped (any) in its own .d.ts — third-party limitation.
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        pyodide.globals.set("__dcq_csv_text", csvText);
        await pyodide.runPythonAsync(
          "import pandas as pd, io\ndf = pd.read_csv(io.StringIO(__dcq_csv_text))",
        );
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      pyodide.globals.set("__dcq_track_row_ids", request.trackRowIdentity ?? true);
      pyodide.runPython("__dcq_reset_state()");
      for (const table of request.extraTables ?? []) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        pyodide.globals.set("__dcq_extra_name", table.name);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        pyodide.globals.set(
          "__dcq_extra_csv",
          table.text ?? (await fetchText(table.url)),
        );
        await pyodide.runPythonAsync(
          "globals()[__dcq_extra_name] = pd.read_csv(io.StringIO(__dcq_extra_csv))",
        );
      }
    } else {
      const startedAt = performance.now();
      replValue = await pyodide.runPythonAsync(request.code);
      elapsedMs = performance.now() - startedAt;
      if (replValue !== undefined && replValue !== null) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        pyodide.globals.set("__dcq_last_value", replValue);
        const tableJson = pyodide.runPython("__dcq_table_of(__dcq_last_value)") as
          string | undefined;
        if (typeof tableJson === "string") {
          outputTable = JSON.parse(tableJson) as OutputTable;
          // The table is shown as a table; do not also echo its repr as text.
          if (isDestroyable(replValue)) replValue.destroy();
          replValue = undefined;
        }
      }
    }

    const resultGrid = serializeDataframe(pyodide);
    postMessage({
      type: "run-result",
      requestId: request.requestId,
      resultGrid,
      output: buildOutput(stdoutBuffer, replValue),
      outputTable,
      ...(elapsedMs === null ? {} : { stats: { elapsedMs } }),
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
