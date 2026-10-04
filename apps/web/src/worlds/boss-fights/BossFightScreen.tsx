import { playCue } from "../../lib/sound";
import { useEffect, useMemo, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { RpcRunError, RpcTimeoutError } from "@dcq/engine-adapters";
import type {
  InitCaseOptions,
  ResultGrid,
  WorkerEngineClient,
} from "@dcq/engine-adapters";
import { TIMEOUT_PREFIX } from "./explainError";
import type { Case, WorldId } from "@dcq/content-schema";
import { PyodideClient } from "../../engines/pyodide-client";
import { SqliteClient } from "../../engines/sqlite-client";
import { loadCase } from "../../lib/load-case";
import { diffGrids } from "../../lib/diff";
import type { CellChange } from "../../lib/diff";
import {
  afflictionCellMap,
  clearedCells,
  totalDebt,
  isWholeTable,
} from "../../lib/affliction-cells";
import type { AfflictionKind } from "../../lib/affliction-cells";
import { evaluateWinCondition } from "../../lib/evaluate-win-condition";
import { NO_RUN } from "../../lib/run-context";
import type { RunContext } from "../../lib/run-context";
import { stampFor } from "../../lib/forge";
import type { Stamp } from "../../lib/forge";
import ForgeBand from "./ForgeBand";
import { classNames } from "../../lib/classNames";
import type { SandboxExtra } from "../../lib/sandbox";
import { TEXT_SCALES } from "../../lib/a11y";
import type { A11yState } from "../../lib/a11y";
import { parseCsv } from "../../engines/csv";
import { caseTechniques, misnamedAnswerTable } from "./caseFormat";
import { bootReadout } from "./bootReadout";
import { formatCellValue } from "./formatCellValue";
import { markJustCleared } from "./afflictionDom";
import { playBossHitRecoil } from "../../anim/world1/battlefieldRecoil";
import { playFightReveal } from "../../anim/world1/fightReveal";
import { playDiffFlashBatch } from "../../anim/world1/diffFlash";
import type { DiffCellRefs } from "../../anim/world1/diffFlash";
import { mountCrtIdle } from "../../anim/world1/crtIdle";
import BootSequence from "./BootSequence";
import EngineSelect from "./EngineSelect";
import LoadingCard from "./LoadingCard";
import type { EngineChoice } from "./EngineSelect";
import BriefingPanel from "./BriefingPanel";
import TopBar from "./TopBar";
import { readDraft, writeDraft } from "../../lib/drafts";
import TableCollage from "./TableCollage";
import DataLayoutBar from "./DataLayoutBar";
import type { DataLayout } from "./DataLayoutBar";
import SandboxBriefing from "./SandboxBriefing";
import SandboxBand from "./SandboxBand";
import HpHeatmap from "./HpHeatmap";
import TumblerBand from "./TumblerBand";
import TwinBand from "./TwinBand";
import BlueprintBand from "./BlueprintBand";
import StarChartBand from "./StarChartBand";
import ReferenceTable from "./ReferenceTable";
import DataframeGrid from "./DataframeGrid";
import type { DataframeGridHandle } from "./DataframeGrid";
import EditorPanel from "./EditorPanel";
import ResizeHandle from "./ResizeHandle";
import { loadPanelSize, savePanelSize } from "./panelSizes";
import type { CodeEditorHandle } from "./CodeEditor";
import RunBar from "./RunBar";
import DiffConsole from "./DiffConsole";
import OutputView from "./OutputView";
import type { RunOutput } from "./OutputView";
import type { ConsoleEntry } from "./DiffConsole";
import { worldMeta } from "../../lib/world-meta";
import VictoryPanel from "./VictoryPanel";
import KillSequence from "./KillSequence";
import TutorialOverlay from "./TutorialOverlay";
import { hasSeenTutorial, markTutorialSeen } from "../../lib/tutorial";
import styles from "./BossFightScreen.module.css";

interface PendingReconciliation {
  changes: CellChange[];
  clearedThisTurn: number;
  justCleared: { rowIndex: number; column: string }[];
}

export interface SandboxSession {
  caseData: Case;
  /** Tables added beside the main one, for practising joins. */
  extras: SandboxExtra[];
  csvText: string;
  fileName: string;
  rowCount: number;
  notes: string[];
}

export interface BossFightScreenProps {
  /** Present in sandbox mode: the player's own CSV, with no win condition, hints or progress. */
  sandbox?: SandboxSession | undefined;
  world: WorldId;
  casePath: string;
  rankLabel: string;
  a11y: A11yState;
  onA11yChange: (next: A11yState) => void;
  onWin: (caseId: string, techniqueKinds: string[], stamp?: Stamp) => void;
  onExitToRoster: () => void;
}

const LAST_ENGINE_KEY = "dcq.lastEngine";

function readLastEngine(): EngineChoice | null {
  try {
    const value = window.localStorage.getItem(LAST_ENGINE_KEY);
    return value === "python" || value === "sql" ? value : null;
  } catch {
    return null;
  }
}

function writeLastEngine(engine: EngineChoice): void {
  try {
    window.localStorage.setItem(LAST_ENGINE_KEY, engine);
  } catch {
    // Not remembered; the engine just is not started early next time.
  }
}

/** Cases where the SQL answer is a table named result. */
function needsAnswerTable(caseData: Case): boolean {
  return (
    caseData.reshapes === true ||
    caseData.winCondition.all.some((p) => p.predicate === "result_matches") ||
    caseData.world === "the-twins" ||
    caseData.world === "the-architect"
  );
}

const LAYOUT_KEY = "dcq.dataLayout";
const NO_CELLS = new Map<string, never>();

function readDataLayout(): DataLayout {
  try {
    return window.localStorage.getItem(LAYOUT_KEY) === "tabs" ? "tabs" : "collage";
  } catch {
    return "collage";
  }
}

function readCollageOrder(caseId: string): string[] {
  try {
    const raw = window.localStorage.getItem(`dcq.collage.${caseId}`);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === "string")
      : [];
  } catch {
    return [];
  }
}

export default function BossFightScreen({
  sandbox,
  world,
  casePath,
  rankLabel,
  a11y,
  onA11yChange,
  onWin,
  onExitToRoster,
}: BossFightScreenProps) {
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [phase, setPhase] = useState<
    "loading" | "engine-select" | "spawning" | "boot" | "fight"
  >("loading");
  const [engine, setEngine] = useState<EngineChoice | null>(null);
  const [grid, setGrid] = useState<ResultGrid | null>(null);
  // Set only when the player has made a `result` table: `grid` is then that answer and this is their data table, left alone.
  const [tableGrid, setTableGrid] = useState<ResultGrid | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([]);
  const [hasWon, setHasWon] = useState(false);
  const [showVictory, setShowVictory] = useState(false);
  const [showKill, setShowKill] = useState(false);
  const killTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeTab, setActiveTab] = useState("data");
  const [lastRun, setLastRun] = useState<RunContext>(NO_RUN);
  const [earnedStamp, setEarnedStamp] = useState<Stamp | null>(null);
  const [railWidth, setRailWidth] = useState<number | null>(() => loadPanelSize("rail"));
  const [briefingHeight, setBriefingHeight] = useState<number | null>(() =>
    loadPanelSize("briefing"),
  );
  const stageRef = useRef<HTMLDivElement>(null);
  const briefingPaneRef = useRef<HTMLDivElement>(null);
  const [hasSelection, setHasSelection] = useState(false);
  const [extraColumns, setExtraColumns] = useState<Record<string, string[]>>({});
  const [runOutput, setRunOutput] = useState<RunOutput | null>(null);
  const [showTutorial, setShowTutorial] = useState(() => !sandbox && !hasSeenTutorial());
  const [runCount, setRunCount] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [dataLayout, setDataLayout] = useState<DataLayout>(readDataLayout);
  const [collageOrder, setCollageOrder] = useState<string[]>([]);
  const [narrowNoticeDismissed, setNarrowNoticeDismissed] = useState(false);
  const [liveMessage, setLiveMessage] = useState("");
  const [liveErrorMessage, setLiveErrorMessage] = useState("");
  const liveMessageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clientRef = useRef<WorkerEngineClient | null>(null);
  /**
   * Engine workers by kind. Python takes a few seconds to start (an interpreter
   * and pandas, compiled to WebAssembly), so it starts as soon as the player
   * points at it on the engine screen, and is usually ready by the click.
   */
  const poolRef = useRef<Record<EngineChoice, WorkerEngineClient | undefined>>({
    python: undefined,
    sql: undefined,
  });

  function ensureClient(kind: EngineChoice): WorkerEngineClient {
    let client = poolRef.current[kind];
    if (!client) {
      client = kind === "sql" ? new SqliteClient() : new PyodideClient();
      client.spawn();
      poolRef.current[kind] = client;
    }
    return client;
  }

  // Someone who picked an engine last time almost always picks it again, so
  // start it as soon as the choice screen appears.
  useEffect(() => {
    if (phase !== "engine-select") return;
    const last = readLastEngine();
    if (last) ensureClient(last);
    // ensureClient only touches refs
  }, [phase]);

  useEffect(() => {
    const pool = poolRef.current;
    return () => {
      for (const client of Object.values(pool)) client?.terminate();
    };
  }, []);

  const gridRef = useRef<DataframeGridHandle>(null);
  const codeEditorRef = useRef<CodeEditorHandle>(null);
  // The Your answer tab only exists while there is a `result` table.
  useEffect(() => {
    if (activeTab === "answer" && !tableGrid) setActiveTab("data");
  }, [activeTab, tableGrid]);

  const fightRootRef = useRef<HTMLDivElement>(null);
  const statusRailRef = useRef<HTMLDivElement>(null);
  const commandRailRef = useRef<HTMLDivElement>(null);
  const battlefieldRef = useRef<HTMLDivElement>(null);
  const crtRef = useRef<HTMLDivElement>(null);
  const rollBarRef = useRef<HTMLDivElement>(null);
  const runButtonRef = useRef<HTMLButtonElement>(null);
  const initialAfflictionRef = useRef<number | null>(null);
  const initialColumnsRef = useRef<string[] | null>(null);
  const justClearedRef = useRef<{ rowIndex: number; column: string }[]>([]);
  const entryIdRef = useRef(0);
  const pendingRef = useRef<PendingReconciliation | null>(null);

  useEffect(() => {
    return () => {
      if (killTimerRef.current) clearTimeout(killTimerRef.current);
    };
  }, []);

  const cellMap = useMemo(
    () =>
      grid && caseData
        ? afflictionCellMap(grid, caseData.winCondition)
        : new Map<string, AfflictionKind>(),
    [grid, caseData],
  );

  useEffect(() => {
    if (phase !== "fight" || !crtRef.current) return;
    return mountCrtIdle(crtRef.current, rollBarRef.current);
  }, [phase]);

  // The fight layout's entrance — previously a hard cut straight from the
  // boot sequence with no reveal at all. Runs once per case (StrictMode's
  // double-invoke just restarts the same fromTo timeline harmlessly).
  useGSAP(
    () => {
      if (phase !== "fight") return;
      playFightReveal({
        railEl: statusRailRef.current,
        commandRailEl: commandRailRef.current,
        battlefieldEl: battlefieldRef.current,
      });
    },
    { scope: fightRootRef, dependencies: [phase] },
  );

  // Fetches case content only — no engine is spawned yet (plan's dual-engine
  // requirement: neither PyodideClient nor SqliteClient should pay its
  // cold-start cost until the player has actually picked one).
  useEffect(() => {
    let cancelled = false;
    setCaseData(null);
    setEngine(null);
    setPhase("loading");

    async function load(): Promise<void> {
      try {
        const loadedCase = sandbox ? sandbox.caseData : await loadCase(casePath);
        if (cancelled) return;
        setCaseData(loadedCase);
        setCollageOrder(readCollageOrder(loadedCase.id));
        setPhase("engine-select");
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : String(err));
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [casePath, sandbox]);

  /** What the engine needs to load this case's table (also used when it is restarted). */
  function initOptionsFor(activeCase: Case): InitCaseOptions {
    return {
      extraTables: (activeCase.extraTables ?? []).map((t) => {
        const own = sandbox?.extras.find((e) => e.name === t.name);
        return { name: t.name, url: t.path, ...(own ? { text: own.csvText } : {}) };
      }),
      trackRowIdentity: !activeCase.reshapes,
      ...(sandbox ? { datasetText: sandbox.csvText } : {}),
      ...(activeCase.generated ? { generated: activeCase.generated } : {}),
    };
  }

  /**
   * A run that goes past the time limit cannot be interrupted (no
   * SharedArrayBuffer), so the stuck worker is thrown away and a fresh one is
   * started on the case's original table. Without this, every later run would
   * time out too while the old one kept grinding.
   */
  async function restartEngine(activeCase: Case): Promise<void> {
    const kind: EngineChoice = engine === "sql" ? "sql" : "python";
    poolRef.current[kind]?.terminate();
    poolRef.current[kind] = undefined;
    const fresh = ensureClient(kind);
    clientRef.current = fresh;
    await fresh.ready();
    const result = await fresh.initCase(
      activeCase.datasetPath,
      initOptionsFor(activeCase),
    );
    setGrid(result.resultGrid);
    setTableGrid(result.tableGrid ?? null);
    setLastRun(NO_RUN);
  }

  // Runs once the player commits to an engine on the EngineSelect screen —
  // spawns that engine's worker, loads the dataset into it, and only then
  // reveals the BootSequence. See WorkerEngineClient's doc comment for why
  // PyodideClient/SqliteClient only differ in which worker file they spawn.
  useEffect(() => {
    if (!engine || !caseData) return;
    // A plain boolean (even boxed in a ref) gets narrowed to a literal by
    // TS's control-flow analysis after the first early-return check, which
    // makes every later check look "always false" to no-unnecessary-condition
    // — even though the cleanup below can flip it between awaits at runtime.
    // Routing the read through a function call sidesteps that narrowing.
    let cancelled = false;
    const isCancelled = (): boolean => cancelled;
    const activeCase = caseData;
    // Drop an engine that was warmed up but not chosen.
    for (const kind of ["python", "sql"] as const) {
      if (kind !== engine) {
        poolRef.current[kind]?.terminate();
        poolRef.current[kind] = undefined;
      }
    }
    const client = ensureClient(engine);
    clientRef.current = client;
    setPhase("spawning");

    async function boot(): Promise<void> {
      try {
        client.spawn();
        await client.ready();
        if (isCancelled()) return;
        const result = await client.initCase(
          activeCase.datasetPath,
          initOptionsFor(activeCase),
        );
        if (isCancelled()) return;

        initialColumnsRef.current = result.resultGrid.columns;
        const loadedExtras: Record<string, string[]> = {};
        for (const table of activeCase.extraTables ?? []) {
          const own = sandbox?.extras.find((e) => e.name === table.name);
          const text = own ? own.csvText : await (await fetch(table.path)).text();
          loadedExtras[table.name] = parseCsv(text).columns;
        }
        if (isCancelled()) return;
        setExtraColumns(loadedExtras);
        setGrid(result.resultGrid);
        setTableGrid(result.tableGrid ?? null);
        initialAfflictionRef.current = totalDebt(
          result.resultGrid,
          activeCase.winCondition,
        );
        // Sandbox has nothing to scan for, so it skips the boot sequence.
        setPhase(sandbox ? "fight" : "boot");
      } catch (err) {
        if (!isCancelled())
          setLoadError(err instanceof Error ? err.message : String(err));
      }
    }

    void boot();

    return () => {
      // Workers are shut down when the screen unmounts (see the pool above), not
      // here, so a warmed-up engine survives React re-running this effect.
      cancelled = true;
    };
    // initOptionsFor only reads `sandbox`, which is listed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, caseData, sandbox]);

  // Post-run reconciliation: populate diff spans + fire the flash/recoil once
  // the grid has re-rendered with new values (DOM already shows new values;
  // this fills in the "old" side and lets the animation reveal the change).
  useEffect(() => {
    const pending = pendingRef.current;
    if (!pending || !grid) return;
    pendingRef.current = null;

    for (const { rowIndex, column } of justClearedRef.current) {
      const el = gridRef.current?.getCellElement(rowIndex, column);
      if (el) markJustCleared(el, false);
    }
    justClearedRef.current = pending.justCleared;

    for (const { rowIndex, column } of pending.justCleared) {
      const el = gridRef.current?.getCellElement(rowIndex, column);
      if (el) markJustCleared(el, true);
    }

    const cellRefs: DiffCellRefs[] = [];
    for (const change of pending.changes) {
      const cellEl = gridRef.current?.getCellElement(change.rowIndex, change.column);
      if (!cellEl) continue;

      const gutterEl = cellEl.querySelector<HTMLElement>('[data-role="gutter"]');
      const oldEl = cellEl.querySelector<HTMLElement>('[data-role="old"]');
      const newEl = cellEl.querySelector<HTMLElement>('[data-role="new"]');
      if (!gutterEl || !oldEl || !newEl) continue;

      oldEl.textContent = formatCellValue(change.before);
      cellRefs.push({ cellEl, gutterEl, oldEl, newEl });
    }

    if (cellRefs.length > 0) playDiffFlashBatch(cellRefs);

    if (battlefieldRef.current && !sandbox) {
      playBossHitRecoil({
        battlefieldEl: battlefieldRef.current,
        crtEl: crtRef.current,
        clearedThisTurn: pending.clearedThisTurn,
        totalAffliction: initialAfflictionRef.current ?? 1,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per new grid; sandbox is fixed for the life of the screen
  }, [grid]);

  /** Debounced per spec §3.6 — a fast series of runs shouldn't queue up a stack of polite announcements. */
  function announcePolite(message: string): void {
    if (liveMessageTimeoutRef.current) clearTimeout(liveMessageTimeoutRef.current);
    liveMessageTimeoutRef.current = setTimeout(() => {
      setLiveMessage(message);
    }, 400);
  }

  async function handleRun(): Promise<void> {
    const client = clientRef.current;
    if (!client || !grid || !caseData || isRunning) return;
    const runnable = codeEditorRef.current?.getRunnableText();
    const code = runnable?.text ?? "";
    if (!code.trim()) return;

    setIsRunning(true);
    // The "before" picture the run is compared with. Running the whole editor
    // always starts from the original table, so the code on screen fully
    // decides the result and running it twice gives the same answer (no
    // "column already exists", no melting an already melted table). Running a
    // selection works on the table as it is now, like a worksheet.
    let baseGrid = grid;
    let baseTable = tableGrid;
    let baseCellMap = cellMap;
    try {
      if (runnable?.isSelection !== true) {
        const fresh = await client.initCase(
          caseData.datasetPath,
          initOptionsFor(caseData),
        );
        baseGrid = fresh.resultGrid;
        baseTable = fresh.tableGrid ?? null;
        baseCellMap = afflictionCellMap(baseGrid, caseData.winCondition);
        setConsoleEntries([]);
      }
      const result = await client.run(code);
      const nextGrid = result.resultGrid;
      const run: RunContext = {
        elapsedMs: result.stats?.elapsedMs ?? null,
        engine: engine === "sql" ? "sql" : "python",
      };
      setLastRun(run);
      // A reshaping case (melt, pivot, flatten) changes rows and columns wholesale,
      // so a per-cell diff against the old table would be noise: summarize the shape instead.
      const reshaped =
        caseData.reshapes === true &&
        (nextGrid.rows.length !== baseGrid.rows.length ||
          nextGrid.columns.join("\u0000") !== baseGrid.columns.join("\u0000"));
      const changes = reshaped ? [] : diffGrids(baseGrid, nextGrid);
      const beforeAfflicted = baseCellMap.size;
      const nextCellMap = afflictionCellMap(nextGrid, caseData.winCondition);
      const afterAfflicted = nextCellMap.size;
      const clearedThisTurn = Math.max(0, beforeAfflicted - afterAfflicted);
      const justCleared = clearedCells(baseGrid, baseCellMap, nextGrid, nextCellMap);

      const nextOutput: RunOutput = result.outputTable
        ? { kind: "table", table: result.outputTable }
        : result.output
          ? { kind: "text", text: result.output }
          : { kind: "empty" };
      // In the worlds where the answer is the table named `result`, say so if the player
      // built a table under another name (the usual slip), instead of leaving them guessing.
      const wrongName =
        engine === "sql" && !result.tableGrid && needsAnswerTable(caseData)
          ? misnamedAnswerTable(code)
          : null;
      if (wrongName) {
        const tip = `You created a table named "${wrongName}". The table that gets judged is named result. Create it as: CREATE TABLE result AS SELECT ...`;
        if (nextOutput.kind === "text") nextOutput.text = `${nextOutput.text}\n\n${tip}`;
        else if (nextOutput.kind === "empty") {
          Object.assign(nextOutput, { kind: "text", text: tip });
        }
      }
      setRunOutput(nextOutput);
      // A returned table goes to the Output tab; a `result` table the player just made goes to
      // the Your answer tab; a plain edit goes to the data so the change is visible.
      setActiveTab(
        nextOutput.kind === "table"
          ? "result"
          : result.tableGrid
            ? "answer"
            : nextOutput.kind === "empty"
              ? "data"
              : "result",
      );

      if (changes.length > 0) {
        const entryId = `run-${String(entryIdRef.current++)}`;
        setConsoleEntries((prev) => [
          ...prev,
          {
            kind: "diff",
            id: entryId,
            lines: changes.map((c) => ({
              rowIndex: c.rowIndex,
              column: c.column,
              before: formatCellValue(c.before),
              after: formatCellValue(c.after),
            })),
          },
        ]);
      } else {
        const entryId = `info-${String(entryIdRef.current++)}`;
        setConsoleEntries((prev) => [
          ...prev,
          {
            kind: "info",
            id: entryId,
            text: result.tableGrid
              ? `your answer (result): ${String(nextGrid.rows.length)} rows x ${String(nextGrid.columns.length)} columns`
              : reshaped
                ? `reshaped: ${String(baseGrid.rows.length)} rows x ${String(baseGrid.columns.length)} columns -> ${String(nextGrid.rows.length)} rows x ${String(nextGrid.columns.length)} columns`
                : sandbox
                  ? "no change to the data"
                  : `no change — ${String(totalDebt(nextGrid, caseData.winCondition, run)).padStart(3, "0")} left to fix`,
          },
        ]);
      }

      pendingRef.current = { changes, clearedThisTurn, justCleared };
      setGrid(nextGrid);
      setTableGrid(result.tableGrid ?? null);
      announcePolite(
        sandbox
          ? `Run complete. ${String(changes.length)} cells changed.`
          : `Run complete. ${String(changes.length)} cells changed. ${String(totalDebt(nextGrid, caseData.winCondition, run))} left to fix.`,
      );

      setRunCount((n) => n + 1);
      playCue(clearedThisTurn > 0 ? "clear" : "run");
      if (!sandbox && evaluateWinCondition(nextGrid, caseData.winCondition, run)) {
        setHasWon(true);
        const stamp = stampFor(caseData.winCondition, caseData.forge, run);
        setEarnedStamp(stamp);
        // Let the last run's diff flash land, then play the kill; the victory panel follows it.
        killTimerRef.current = setTimeout(() => {
          setShowKill(true);
        }, 750);
        onWin(caseData.id, caseTechniques(caseData), stamp ?? undefined);
      }
    } catch (err) {
      playCue("error");
      // The engine already holds the fresh table, so show that, not the last result.
      if (baseGrid !== grid) {
        setGrid(baseGrid);
        setTableGrid(baseTable);
      }
      if (err instanceof RpcRunError) {
        setRunOutput({ kind: "error", message: err.message });
        setActiveTab("result");
        setLiveErrorMessage(`Run failed. ${err.message.split("\n")[0] ?? ""}`);
      } else if (err instanceof RpcTimeoutError) {
        setRunOutput({
          kind: "error",
          message: `${TIMEOUT_PREFIX} your code ran for more than 20 seconds.`,
        });
        setActiveTab("result");
        setLiveErrorMessage("Run timed out. The engine was restarted.");
        try {
          await restartEngine(caseData);
        } catch (restartError) {
          setLoadError(
            restartError instanceof Error ? restartError.message : String(restartError),
          );
        }
      } else {
        throw err;
      }
    } finally {
      setIsRunning(false);
    }
  }

  /** The top bar: the same in every phase, so it never disappears while an engine loads. */
  function renderRail(ref?: React.Ref<HTMLDivElement>): React.JSX.Element {
    return (
      <TopBar
        backLabel={sandbox ? "< Back" : "< Roster"}
        onBack={onExitToRoster}
        worldName={sandbox ? "SANDBOX" : worldMeta(world).statusRailName}
        title={caseData?.strings.title}
        finalBoss={caseData?.tier === "final-boss"}
        rank={sandbox ? undefined : rankLabel}
        a11y={a11y}
        onA11yChange={onA11yChange}
        {...(ref ? { railRef: ref } : {})}
      />
    );
  }

  /** A loading or choosing screen under the top bar. */
  function phaseScreen(children: React.ReactNode): React.JSX.Element {
    return (
      <div className={styles.fightRoot} data-world={world}>
        {renderRail()}
        <div className={styles.phaseBody}>{children}</div>
      </div>
    );
  }

  if (loadError) {
    return phaseScreen(
      <div className={styles.loadingScreen} role="alert">
        <span className={styles.loadingLine}>DCQ//BOOT v0.1.0</span>
        <span className={classNames(styles.loadingLine, styles.loadingError)}>
          engine failed to start — {loadError}
        </span>
        <span className={styles.loadingLine}>reload the page to try again</span>
      </div>,
    );
  }

  if (phase === "loading" || !caseData) {
    return phaseScreen(<LoadingCard title="Loading" text="Fetching the case." />);
  }

  if (phase === "engine-select") {
    return phaseScreen(
      <EngineSelect
        bossName={caseData.strings.title}
        onSelect={(choice) => {
          writeLastEngine(choice);
          setEngine(choice);
        }}
        onWarm={(choice) => {
          ensureClient(choice);
        }}
      />,
    );
  }

  // Choosing an engine opens the intro right away; it waits on its first lines until the
  // engine is ready, so Python and SQL start the same way. The sandbox has no intro.
  if ((phase === "spawning" || phase === "boot") && !sandbox) {
    const bootText = grid ? bootReadout(grid, caseData.winCondition, world) : null;
    return phaseScreen(
      <BootSequence
        bossName={caseData.strings.title}
        engineLabel={engine === "sql" ? "sql.js/wasm" : "pyodide/wasm"}
        info={
          grid && bootText
            ? {
                datasetFileName: caseData.datasetPath.split("/").pop() ?? "dataset.csv",
                datasetShape: `${String(grid.rows.length)}x${String(grid.columns.length)}`,
                afflictionCount: initialAfflictionRef.current ?? 0,
                scanLabel: bootText.scanLabel,
                detectedText: bootText.detected,
              }
            : null
        }
        slowHint={
          engine === "sql"
            ? undefined
            : "Python and pandas load once, which takes a few seconds the first time."
        }
        onEngage={() => {
          setPhase("fight");
        }}
      />,
    );
  }

  if (phase === "spawning" || !grid) {
    return phaseScreen(
      <LoadingCard
        title={engine === "sql" ? "Starting SQL" : "Starting Python"}
        text={
          engine === "sql"
            ? "SQLite runs inside your browser. It is small, so this takes a moment."
            : "Python and pandas run inside your browser, so they have to load first. That takes a few seconds the first time and is quicker after that."
        }
      />,
    );
  }

  const mainTable = engine === "sql" ? "data" : "df";
  const editorSchema: Record<string, string[]> = {
    [mainTable]: initialColumnsRef.current ?? grid.columns,
    ...extraColumns,
  };
  const remaining = totalDebt(grid, caseData.winCondition, lastRun);
  const extraTables = caseData.extraTables ?? [];
  const inCollage = extraTables.length > 0 && dataLayout === "collage";
  // "Your data" always shows the player's own table. When they have built a `result`
  // table, that table is the answer and lives on its own tab.
  const engineKey = engine === "sql" ? "sql" : "python";
  const starterCode =
    engine === "sql" ? caseData.starterCode.sql : caseData.starterCode.python;
  const savedDraft = sandbox ? null : readDraft(caseData.id, engineKey);
  // In Python the answer replaces df, so the table you started with gets its own tab to look back at.
  const showOriginal =
    engine === "python" &&
    !sandbox &&
    caseData.generated === undefined &&
    needsAnswerTable(caseData);
  const dataView = tableGrid ?? grid;
  const textScale = TEXT_SCALES[a11y.textScaleIndex] ?? 1;
  const mainGrid = (
    <DataframeGrid
      ref={tableGrid ? undefined : gridRef}
      grid={dataView}
      afflictionCellMap={tableGrid ? NO_CELLS : cellMap}
      textScale={textScale}
      columnHints={caseData.columnHints}
    />
  );

  return (
    <div className={styles.fightRoot} data-world={world} ref={fightRootRef}>
      {renderRail(statusRailRef)}
      {narrowNoticeDismissed ? null : (
        <div className={styles.narrowNotice}>
          <span>NARROW DISPLAY // EDITOR IS CRAMPED BELOW 720PX</span>
          <button
            type="button"
            className={styles.narrowNoticeDismiss}
            aria-label="Dismiss narrow display notice"
            onClick={() => {
              setNarrowNoticeDismissed(true);
            }}
          >
            ×
          </button>
        </div>
      )}
      <div
        className={styles.stage}
        ref={stageRef}
        style={
          railWidth
            ? ({ "--rail-w": `${String(railWidth)}px` } as React.CSSProperties)
            : undefined
        }
      >
        <div
          className={styles.commandRail}
          ref={commandRailRef}
          style={
            briefingHeight
              ? ({ "--briefing-h": `${String(briefingHeight)}px` } as React.CSSProperties)
              : undefined
          }
        >
          <div className={styles.briefingPane} ref={briefingPaneRef}>
            {sandbox ? (
              <SandboxBriefing
                extras={sandbox.extras}
                fileName={sandbox.fileName}
                language={engine === "sql" ? "sql" : "python"}
                columns={initialColumnsRef.current ?? grid.columns}
                rowCount={sandbox.rowCount}
                notes={sandbox.notes}
                onUse={(code) => {
                  codeEditorRef.current?.setValue(code);
                }}
              />
            ) : (
              <BriefingPanel
                title={caseData.strings.title}
                subtitle={caseData.strings.subtitle}
                briefing={caseData.strings.briefing}
                task={caseData.strings.task}
                grid={grid}
                winCondition={caseData.winCondition}
                run={lastRun}
                remaining={remaining}
                initial={initialAfflictionRef.current ?? remaining}
                tier={caseData.tier}
                hints={engine === "sql" ? caseData.hints?.sql : caseData.hints?.python}
                onHintRevealed={setHintsUsed}
              />
            )}
          </div>
          <ResizeHandle
            orientation="horizontal"
            className={styles.briefingHandle}
            label="Resize the task and the editor"
            getSize={() => briefingPaneRef.current?.getBoundingClientRect().height ?? 0}
            min={() => 120}
            max={() =>
              Math.max(
                160,
                (commandRailRef.current?.getBoundingClientRect().height ?? 600) -
                  12 -
                  48 -
                  220,
              )
            }
            onResize={(px) => {
              commandRailRef.current?.style.setProperty(
                "--briefing-h",
                `${String(px)}px`,
              );
            }}
            onCommit={(px) => {
              setBriefingHeight(px);
              savePanelSize("briefing", px);
            }}
            onReset={() => {
              commandRailRef.current?.style.removeProperty("--briefing-h");
              setBriefingHeight(null);
              savePanelSize("briefing", null);
            }}
          />
          <div className={styles.editorPane}>
            <EditorPanel
              ref={codeEditorRef}
              language={engine === "sql" ? "sql" : "python"}
              starterCode={starterCode}
              initialCode={savedDraft ?? starterCode}
              onCodeChange={(value) => {
                if (!sandbox) writeDraft(caseData.id, engineKey, value, starterCode);
              }}
              schema={editorSchema}
              dark={a11y.theme === "dark"}
              onSelectionChange={setHasSelection}
              onRun={() => {
                void handleRun();
              }}
              onEscape={() => {
                runButtonRef.current?.focus();
              }}
            />
          </div>
          <div className={styles.runBarPane}>
            <RunBar
              hasSelection={hasSelection}
              isRunning={isRunning}
              onRun={() => {
                void handleRun();
              }}
              buttonRef={runButtonRef}
            />
          </div>
        </div>
        <div className={styles.battlefield} ref={battlefieldRef}>
          {sandbox ? (
            <SandboxBand grid={dataView} fileName={sandbox.fileName} />
          ) : world === "the-vault" ? (
            <TumblerBand grid={grid} winCondition={caseData.winCondition} />
          ) : caseData.winCondition.all.some((p) => p.predicate === "result_matches") ? (
            <StarChartBand grid={grid} winCondition={caseData.winCondition} />
          ) : world === "the-twins" ? (
            <TwinBand
              grid={grid}
              winCondition={caseData.winCondition}
              leftName={engine === "sql" ? "data" : "df"}
              rightName={caseData.extraTables?.[0]?.name ?? "other"}
            />
          ) : world === "the-foundry" ? (
            <ForgeBand
              winCondition={caseData.winCondition}
              forge={caseData.forge}
              run={lastRun}
              engine={engine === "sql" ? "sql" : "python"}
              rows={grid.rows.length}
            />
          ) : world === "the-observatory" ? (
            <StarChartBand grid={grid} winCondition={caseData.winCondition} />
          ) : world === "the-architect" ? (
            <BlueprintBand grid={grid} winCondition={caseData.winCondition} />
          ) : (
            <HpHeatmap grid={grid} winCondition={caseData.winCondition} />
          )}
          <div className={styles.gridWrap}>
            <div className={styles.tabs} role="tablist" aria-label="Views">
              {[
                { id: "data", label: "Your data" },
                ...(tableGrid ? [{ id: "answer", label: "Your answer (result)" }] : []),
                { id: "result", label: "Output" },
                {
                  id: "changes",
                  label: `Changes${consoleEntries.length ? ` (${String(consoleEntries.length)})` : ""}`,
                },
                ...(showOriginal ? [{ id: "original", label: "df (original)" }] : []),
                ...(inCollage
                  ? []
                  : (caseData.extraTables ?? []).map((t) => ({
                      id: t.name,
                      label: `${t.name} (original)`,
                    }))),
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`tab-${tab.id}`}
                  aria-selected={activeTab === tab.id}
                  aria-controls={`pane-${tab.id}`}
                  className={styles.tab}
                  data-error={
                    tab.id === "result" && runOutput?.kind === "error"
                      ? "true"
                      : undefined
                  }
                  onClick={() => {
                    setActiveTab(tab.id);
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className={styles.panes}>
              <div
                className={styles.tablePane}
                id="pane-data"
                role="tabpanel"
                aria-labelledby="tab-data"
                hidden={activeTab !== "data"}
              >
                {tableGrid ? (
                  <div className={styles.answerNote}>
                    This is your <code>{engine === "sql" ? "data" : "df"}</code> table, as
                    your code left it. Your answer is the table named <code>result</code>,
                    on the{" "}
                    <button
                      type="button"
                      className={styles.noteLink}
                      onClick={() => {
                        setActiveTab("answer");
                      }}
                    >
                      Your answer
                    </button>{" "}
                    tab.
                  </div>
                ) : null}
                {extraTables.length > 0 ? (
                  <DataLayoutBar
                    layout={dataLayout}
                    tableCount={extraTables.length + 1}
                    onChange={(next) => {
                      setDataLayout(next);
                      try {
                        window.localStorage.setItem(LAYOUT_KEY, next);
                      } catch {
                        // The choice just is not remembered.
                      }
                      if (
                        next === "collage" &&
                        !["data", "result", "changes"].includes(activeTab)
                      ) {
                        setActiveTab("data");
                      }
                    }}
                  />
                ) : null}
                {inCollage ? (
                  <TableCollage
                    panes={[
                      {
                        id: "main",
                        title: engine === "sql" ? "data" : "df",
                        note: "your table",
                        content: mainGrid,
                      },
                      ...extraTables.map((t) => ({
                        id: t.name,
                        title: t.name,
                        note: "original",
                        content: (
                          <ReferenceTable
                            url={t.path}
                            text={sandbox?.extras.find((e) => e.name === t.name)?.csvText}
                            columnHints={caseData.columnHints}
                            textScale={TEXT_SCALES[a11y.textScaleIndex] ?? 1}
                          />
                        ),
                      })),
                    ]}
                    order={collageOrder}
                    splitKey={caseData.id}
                    onOrderChange={(next) => {
                      setCollageOrder(next);
                      try {
                        window.localStorage.setItem(
                          `dcq.collage.${caseData.id}`,
                          JSON.stringify(next),
                        );
                      } catch {
                        // The order just is not remembered.
                      }
                    }}
                  />
                ) : (
                  mainGrid
                )}
              </div>
              {showOriginal ? (
                <div
                  className={styles.tablePane}
                  id="pane-original"
                  role="tabpanel"
                  aria-labelledby="tab-original"
                  hidden={activeTab !== "original"}
                >
                  <div className={styles.answerNote}>
                    The table you started with, as it was loaded. Your code runs on a
                    fresh copy of it every time, and <code>df</code> becomes your answer.
                  </div>
                  <ReferenceTable
                    url={caseData.datasetPath}
                    columnHints={caseData.columnHints}
                    textScale={textScale}
                  />
                </div>
              ) : null}
              {tableGrid ? (
                <div
                  className={styles.tablePane}
                  id="pane-answer"
                  role="tabpanel"
                  aria-labelledby="tab-answer"
                  hidden={activeTab !== "answer"}
                >
                  <div className={styles.answerNote}>
                    <strong>Your answer</strong> is the table named <code>result</code>,
                    built by your <code>CREATE TABLE result</code>. This is the table that
                    gets judged.
                  </div>
                  <DataframeGrid
                    ref={gridRef}
                    grid={grid}
                    afflictionCellMap={cellMap}
                    textScale={textScale}
                    columnHints={caseData.columnHints}
                  />
                </div>
              ) : null}
              <div
                className={styles.tablePane}
                id="pane-result"
                role="tabpanel"
                aria-labelledby="tab-result"
                hidden={activeTab !== "result"}
              >
                <OutputView
                  output={runOutput}
                  language={engine === "sql" ? "sql" : "python"}
                  textScale={TEXT_SCALES[a11y.textScaleIndex] ?? 1}
                  onShowData={() => {
                    setActiveTab("data");
                  }}
                />
              </div>
              <div
                className={styles.tablePane}
                id="pane-changes"
                role="tabpanel"
                aria-labelledby="tab-changes"
                hidden={activeTab !== "changes"}
              >
                <DiffConsole entries={consoleEntries} />
              </div>
              {caseData.extraTables?.map((t) => (
                <div
                  key={t.name}
                  className={styles.tablePane}
                  id={`pane-${t.name}`}
                  role="tabpanel"
                  aria-labelledby={`tab-${t.name}`}
                  hidden={activeTab !== t.name}
                >
                  <ReferenceTable
                    url={t.path}
                    text={sandbox?.extras.find((e) => e.name === t.name)?.csvText}
                    columnHints={caseData.columnHints}
                    textScale={TEXT_SCALES[a11y.textScaleIndex] ?? 1}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        <ResizeHandle
          orientation="vertical"
          className={styles.railHandle}
          label="Resize the left panel and the data"
          getSize={() => commandRailRef.current?.getBoundingClientRect().width ?? 0}
          min={() => 340}
          max={() => {
            const stageWidth = stageRef.current?.getBoundingClientRect().width ?? 1200;
            return Math.max(360, Math.min(stageWidth * 0.72, stageWidth - 380));
          }}
          onResize={(px) => {
            stageRef.current?.style.setProperty("--rail-w", `${String(px)}px`);
          }}
          onCommit={(px) => {
            setRailWidth(px);
            savePanelSize("rail", px);
          }}
          onReset={() => {
            stageRef.current?.style.removeProperty("--rail-w");
            setRailWidth(null);
            savePanelSize("rail", null);
          }}
        />
      </div>
      <div ref={crtRef} className={styles.crt} aria-hidden="true">
        <div ref={rollBarRef} className={styles.crtRoll} />
      </div>
      <div aria-live="polite" className={styles.srOnly}>
        {liveMessage}
      </div>
      <div aria-live="assertive" className={styles.srOnly}>
        {liveErrorMessage}
      </div>
      {hasWon ? (
        <div className={styles.srOnly} role="status">
          Boss defeated. {caseData.strings.title} neutralized.
        </div>
      ) : null}
      {showTutorial ? (
        <TutorialOverlay
          engineLabel={engine === "sql" ? "SQLite" : "pandas"}
          onClose={() => {
            markTutorialSeen();
            setShowTutorial(false);
          }}
        />
      ) : null}
      {showKill ? (
        <KillSequence
          bossName={caseData.strings.title}
          clearedLabel={worldMeta(world).clearedLabel}
          onDone={() => {
            setShowKill(false);
            setShowVictory(true);
          }}
        />
      ) : null}
      {showVictory ? (
        <VictoryPanel
          kicker={worldMeta(world).clearedLabel}
          stamp={earnedStamp}
          elapsedMs={lastRun.elapsedMs}
          bossName={caseData.strings.title}
          runCount={runCount}
          cleanedLabel={
            caseData.winCondition.all.some((p) => !isWholeTable(p))
              ? "Cells cleaned"
              : "Checks passed"
          }
          cellsCleared={
            caseData.winCondition.all.some((p) => !isWholeTable(p))
              ? (initialAfflictionRef.current ?? 0)
              : caseData.winCondition.all.length
          }
          techniques={caseTechniques(caseData)}
          hintsUsed={hintsUsed}
          getSolution={() => {
            const code = codeEditorRef.current?.getValue() ?? "";
            const mark = engine === "sql" ? "--" : "#";
            return `${mark} Data Cleaning Quest: ${caseData.strings.title}\n${code}\n`;
          }}
          onContinue={() => {
            setShowVictory(false);
          }}
          onExitToRoster={onExitToRoster}
        />
      ) : null}
    </div>
  );
}
