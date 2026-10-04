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
  predicateKindOrder,
} from "../../lib/affliction-cells";
import type { AfflictionKind } from "../../lib/affliction-cells";
import { evaluateWinCondition } from "../../lib/evaluate-win-condition";
import { NO_RUN } from "../../lib/run-context";
import type { RunContext } from "../../lib/run-context";
import { stampFor } from "../../lib/forge";
import type { Stamp } from "../../lib/forge";
import ForgeBand from "./ForgeBand";
import { classNames } from "../../lib/classNames";
import { TEXT_SCALES } from "../../lib/a11y";
import type { A11yState } from "../../lib/a11y";
import { parseCsv } from "../../engines/csv";
import { predicateKinds } from "./caseFormat";
import { formatCellValue } from "./formatCellValue";
import { markJustCleared } from "./afflictionDom";
import { SCAN_CODE } from "./afflictionPresentation";
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
import SandboxBriefing from "./SandboxBriefing";
import SandboxBand from "./SandboxBand";
import HpHeatmap from "./HpHeatmap";
import TumblerBand from "./TumblerBand";
import TwinBand from "./TwinBand";
import BlueprintBand from "./BlueprintBand";
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
import A11yControls from "./A11yControls";
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
      extraTables: (activeCase.extraTables ?? []).map((t) => ({
        name: t.name,
        url: t.path,
      })),
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
          const text = await (await fetch(table.path)).text();
          loadedExtras[table.name] = parseCsv(text).columns;
        }
        if (isCancelled()) return;
        setExtraColumns(loadedExtras);
        setGrid(result.resultGrid);
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
    const code = codeEditorRef.current?.getRunnableText().text ?? "";
    if (!code.trim()) return;

    setIsRunning(true);
    try {
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
        (nextGrid.rows.length !== grid.rows.length ||
          nextGrid.columns.join("\u0000") !== grid.columns.join("\u0000"));
      const changes = reshaped ? [] : diffGrids(grid, nextGrid);
      const beforeAfflicted = cellMap.size;
      const nextCellMap = afflictionCellMap(nextGrid, caseData.winCondition);
      const afterAfflicted = nextCellMap.size;
      const clearedThisTurn = Math.max(0, beforeAfflicted - afterAfflicted);
      const justCleared = clearedCells(grid, cellMap, nextGrid, nextCellMap);

      const nextOutput: RunOutput = result.outputTable
        ? { kind: "table", table: result.outputTable }
        : result.output
          ? { kind: "text", text: result.output }
          : { kind: "empty" };
      setRunOutput(nextOutput);
      // Something to read goes to the Result tab; a plain edit goes to the data so the change is visible.
      setActiveTab(nextOutput.kind === "empty" ? "data" : "result");

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
            text: reshaped
              ? `reshaped: ${String(grid.rows.length)} rows x ${String(grid.columns.length)} columns -> ${String(nextGrid.rows.length)} rows x ${String(nextGrid.columns.length)} columns`
              : sandbox
                ? "no change to the data"
                : `no change — ${String(totalDebt(nextGrid, caseData.winCondition, run)).padStart(3, "0")} left to fix`,
          },
        ]);
      }

      pendingRef.current = { changes, clearedThisTurn, justCleared };
      setGrid(nextGrid);
      announcePolite(
        sandbox
          ? `Run complete. ${String(changes.length)} cells changed.`
          : `Run complete. ${String(changes.length)} cells changed. ${String(totalDebt(nextGrid, caseData.winCondition, run))} left to fix.`,
      );

      setRunCount((n) => n + 1);
      if (!sandbox && evaluateWinCondition(nextGrid, caseData.winCondition, run)) {
        setHasWon(true);
        const stamp = stampFor(caseData.winCondition, caseData.forge, run);
        setEarnedStamp(stamp);
        // Let the last run's diff flash land, then play the kill; the victory panel follows it.
        killTimerRef.current = setTimeout(() => {
          setShowKill(true);
        }, 750);
        onWin(caseData.id, predicateKinds(caseData.winCondition), stamp ?? undefined);
      }
    } catch (err) {
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

  if (loadError) {
    return (
      <div className={styles.fightRoot} data-world={world}>
        <div className={styles.loadingScreen} role="alert">
          <span className={styles.loadingLine}>DCQ//BOOT v0.1.0</span>
          <span className={classNames(styles.loadingLine, styles.loadingError)}>
            engine failed to start — {loadError}
          </span>
          <span className={styles.loadingLine}>reload the page to try again</span>
        </div>
      </div>
    );
  }

  if (phase === "loading" || !caseData) {
    return (
      <div className={styles.fightRoot} data-world={world}>
        <LoadingCard title="Loading" text="Fetching the case." />
      </div>
    );
  }

  if (phase === "engine-select") {
    return (
      <div className={styles.fightRoot} data-world={world}>
        <EngineSelect
          bossName={caseData.strings.title}
          onSelect={(choice) => {
            writeLastEngine(choice);
            setEngine(choice);
          }}
          onWarm={(choice) => {
            ensureClient(choice);
          }}
        />
      </div>
    );
  }

  if (phase === "spawning" || !grid) {
    return (
      <div className={styles.fightRoot} data-world={world}>
        <LoadingCard
          title={engine === "sql" ? "Starting SQL" : "Starting Python"}
          text={
            engine === "sql"
              ? "SQLite runs inside your browser. It is small, so this takes a moment."
              : "Python and pandas run inside your browser, so they have to load first. That takes a few seconds the first time and is quicker after that."
          }
        />
      </div>
    );
  }

  if (phase === "boot") {
    return (
      <div className={styles.fightRoot} data-world={world}>
        <BootSequence
          bossName={caseData.strings.title}
          datasetFileName={caseData.datasetPath.split("/").pop() ?? "dataset.csv"}
          datasetShape={`${String(grid.rows.length)}x${String(grid.columns.length)}`}
          afflictionCount={initialAfflictionRef.current ?? 0}
          scanLabel={predicateKindOrder(caseData.winCondition)
            .map((kind) => SCAN_CODE[kind])
            .join("+")}
          engineLabel={engine === "sql" ? "sql.js/wasm" : "pyodide/wasm"}
          onEngage={() => {
            setPhase("fight");
          }}
        />
      </div>
    );
  }

  const mainTable = engine === "sql" ? "data" : "df";
  const editorSchema: Record<string, string[]> = {
    [mainTable]: initialColumnsRef.current ?? grid.columns,
    ...extraColumns,
  };
  const remaining = totalDebt(grid, caseData.winCondition, lastRun);
  const bossNameStyles = classNames(
    styles.statusRailBoss,
    caseData.tier === "final-boss" && styles.statusRailBossFinal,
  );

  return (
    <div className={styles.fightRoot} data-world={world} ref={fightRootRef}>
      <div className={styles.statusRail} ref={statusRailRef}>
        <span className={styles.railLeft}>
          <button type="button" className={styles.rosterLink} onClick={onExitToRoster}>
            {sandbox ? "< Back" : "< Roster"}
          </button>
          <span className={styles.railDivider} aria-hidden="true" />
          <span className={styles.railTitle}>
            {sandbox ? "SANDBOX" : worldMeta(world).statusRailName} //{" "}
            <span className={bossNameStyles}>{caseData.strings.title}</span>
          </span>
        </span>
        <div className={styles.a11yRow}>
          {sandbox ? null : <span className={styles.rankBadge}>{rankLabel}</span>}
          <A11yControls a11y={a11y} onChange={onA11yChange} />
        </div>
      </div>
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
              starterCode={
                engine === "sql" ? caseData.starterCode.sql : caseData.starterCode.python
              }
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
            <SandboxBand grid={grid} fileName={sandbox.fileName} />
          ) : world === "the-vault" ? (
            <TumblerBand grid={grid} winCondition={caseData.winCondition} />
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
          ) : world === "the-architect" ? (
            <BlueprintBand grid={grid} winCondition={caseData.winCondition} />
          ) : (
            <HpHeatmap grid={grid} winCondition={caseData.winCondition} />
          )}
          <div className={styles.gridWrap}>
            <div className={styles.tabs} role="tablist" aria-label="Views">
              {[
                { id: "data", label: "Your data" },
                { id: "result", label: "Result" },
                {
                  id: "changes",
                  label: `Changes${consoleEntries.length ? ` (${String(consoleEntries.length)})` : ""}`,
                },
                ...(caseData.extraTables ?? []).map((t) => ({
                  id: t.name,
                  label: `${t.name} (original)`,
                })),
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
                <DataframeGrid
                  ref={gridRef}
                  grid={grid}
                  afflictionCellMap={cellMap}
                  textScale={TEXT_SCALES[a11y.textScaleIndex] ?? 1}
                  columnHints={caseData.columnHints}
                />
              </div>
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
          techniques={predicateKinds(caseData.winCondition)}
          hintsUsed={hintsUsed}
          onContinue={() => {
            setShowVictory(false);
          }}
          onExitToRoster={onExitToRoster}
        />
      ) : null}
    </div>
  );
}
