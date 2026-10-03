import { useEffect, useMemo, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { RpcRunError } from "@dcq/engine-adapters";
import type { ResultGrid, WorkerEngineClient } from "@dcq/engine-adapters";
import type { Case, WorldId } from "@dcq/content-schema";
import { PyodideClient } from "../../engines/pyodide-client";
import { SqliteClient } from "../../engines/sqlite-client";
import { loadCase } from "../../lib/load-case";
import { diffGrids } from "../../lib/diff";
import type { CellChange } from "../../lib/diff";
import {
  afflictionCellMap,
  clearedCells,
  countTotalAffliction,
  predicateKindOrder,
} from "../../lib/affliction-cells";
import type { AfflictionKind } from "../../lib/affliction-cells";
import { evaluateWinCondition } from "../../lib/evaluate-win-condition";
import { classNames } from "../../lib/classNames";
import { TEXT_SCALES } from "../../lib/a11y";
import type { A11yState } from "../../lib/a11y";
import { formatWinCondition, predicateKinds } from "./caseFormat";
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
import type { EngineChoice } from "./EngineSelect";
import BriefingPanel from "./BriefingPanel";
import HpHeatmap from "./HpHeatmap";
import DataframeGrid from "./DataframeGrid";
import type { DataframeGridHandle } from "./DataframeGrid";
import CodeEditor from "./CodeEditor";
import type { CodeEditorHandle } from "./CodeEditor";
import RunBar from "./RunBar";
import DiffConsole from "./DiffConsole";
import type { ConsoleEntry } from "./DiffConsole";
import A11yControls from "./A11yControls";
import { worldMeta } from "../../lib/world-meta";
import VictoryPanel from "./VictoryPanel";
import TutorialOverlay from "./TutorialOverlay";
import { hasSeenTutorial, markTutorialSeen } from "../../lib/tutorial";
import styles from "./BossFightScreen.module.css";

interface PendingReconciliation {
  changes: CellChange[];
  clearedThisTurn: number;
  justCleared: { rowIndex: number; column: string }[];
}

export interface BossFightScreenProps {
  world: WorldId;
  casePath: string;
  rankLabel: string;
  a11y: A11yState;
  onA11yChange: (next: A11yState) => void;
  onWin: (caseId: string, techniqueKinds: string[]) => void;
  onExitToRoster: () => void;
}

export default function BossFightScreen({
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
  const [showTutorial, setShowTutorial] = useState(() => !hasSeenTutorial());
  const [runCount, setRunCount] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [narrowNoticeDismissed, setNarrowNoticeDismissed] = useState(false);
  const [liveMessage, setLiveMessage] = useState("");
  const [liveErrorMessage, setLiveErrorMessage] = useState("");
  const liveMessageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clientRef = useRef<WorkerEngineClient | null>(null);

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
  const justClearedRef = useRef<{ rowIndex: number; column: string }[]>([]);
  const entryIdRef = useRef(0);
  const pendingRef = useRef<PendingReconciliation | null>(null);

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
        const loadedCase = await loadCase(casePath);
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
  }, [casePath]);

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
    const client: WorkerEngineClient =
      engine === "sql" ? new SqliteClient() : new PyodideClient();
    clientRef.current = client;
    setPhase("spawning");

    async function boot(): Promise<void> {
      try {
        client.spawn();
        await client.ready();
        if (isCancelled()) return;
        const result = await client.initCase(activeCase.datasetPath);
        if (isCancelled()) return;

        setGrid(result.resultGrid);
        initialAfflictionRef.current = countTotalAffliction(
          result.resultGrid,
          activeCase.winCondition,
        );
        setPhase("boot");
      } catch (err) {
        if (!isCancelled())
          setLoadError(err instanceof Error ? err.message : String(err));
      }
    }

    void boot();

    return () => {
      cancelled = true;
      client.terminate();
    };
  }, [engine, caseData]);

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

    if (battlefieldRef.current) {
      playBossHitRecoil({
        battlefieldEl: battlefieldRef.current,
        crtEl: crtRef.current,
        clearedThisTurn: pending.clearedThisTurn,
        totalAffliction: initialAfflictionRef.current ?? 1,
      });
    }
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
    const code = codeEditorRef.current?.getValue() ?? "";
    if (!code.trim()) return;

    setIsRunning(true);
    try {
      const result = await client.run(code);
      const nextGrid = result.resultGrid;
      const changes = diffGrids(grid, nextGrid);
      const beforeAfflicted = cellMap.size;
      const nextCellMap = afflictionCellMap(nextGrid, caseData.winCondition);
      const afterAfflicted = nextCellMap.size;
      const clearedThisTurn = Math.max(0, beforeAfflicted - afterAfflicted);
      const justCleared = clearedCells(grid, cellMap, nextGrid, nextCellMap);

      const output = result.output;
      if (output) {
        const outputEntryId = `output-${String(entryIdRef.current++)}`;
        setConsoleEntries((prev) => [
          ...prev,
          { kind: "info", id: outputEntryId, text: output },
        ]);
      }

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
            text: `no change — ${String(afterAfflicted).padStart(3, "0")} afflicted cells remain`,
          },
        ]);
      }

      pendingRef.current = { changes, clearedThisTurn, justCleared };
      setGrid(nextGrid);
      announcePolite(
        `Run complete. ${String(changes.length)} cells changed. ${String(afterAfflicted)} afflicted cells remaining.`,
      );

      setRunCount((n) => n + 1);
      if (evaluateWinCondition(nextGrid, caseData.winCondition)) {
        setHasWon(true);
        setShowVictory(true);
        onWin(caseData.id, predicateKinds(caseData.winCondition));
      }
    } catch (err) {
      if (err instanceof RpcRunError) {
        const entryId = `err-${String(entryIdRef.current++)}`;
        setConsoleEntries((prev) => [
          ...prev,
          { kind: "error", id: entryId, message: err.message },
        ]);
        setLiveErrorMessage(`Run failed. ${err.message.split("\n")[0] ?? ""}`);
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
        <div className={styles.loadingScreen} role="status" aria-live="polite">
          <span className={styles.loadingLine}>DCQ//BOOT v0.1.0</span>
          <span className={styles.loadingLine}>loading case data .......</span>
        </div>
      </div>
    );
  }

  if (phase === "engine-select") {
    return (
      <div className={styles.fightRoot} data-world={world}>
        <EngineSelect
          bossName={caseData.strings.title}
          onSelect={(choice) => {
            setEngine(choice);
          }}
        />
      </div>
    );
  }

  if (phase === "spawning" || !grid) {
    return (
      <div className={styles.fightRoot} data-world={world}>
        <div className={styles.loadingScreen} role="status" aria-live="polite">
          <span className={styles.loadingLine}>DCQ//BOOT v0.1.0</span>
          <span className={styles.loadingLine}>
            mounting engine ......... {engine === "sql" ? "sql.js/wasm" : "pyodide/wasm"}
          </span>
        </div>
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

  const remaining = cellMap.size;
  const bossNameStyles = classNames(
    styles.statusRailBoss,
    caseData.tier === "final-boss" && styles.statusRailBossFinal,
  );

  return (
    <div className={styles.fightRoot} data-world={world} ref={fightRootRef}>
      <div className={styles.statusRail} ref={statusRailRef}>
        <span>
          <button type="button" className={styles.rosterLink} onClick={onExitToRoster}>
            &lt; ROSTER
          </button>{" "}
          {worldMeta(world).statusRailName} //{" "}
          <span className={bossNameStyles}>{caseData.strings.title}</span>
        </span>
        <div className={styles.a11yRow}>
          <span className={styles.rankBadge}>{rankLabel}</span>
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
      <div className={styles.stage}>
        <div className={styles.commandRail} ref={commandRailRef}>
          <div className={styles.briefingPane}>
            <BriefingPanel
              title={caseData.strings.title}
              subtitle={caseData.strings.subtitle}
              briefing={caseData.strings.briefing}
              objectiveLabel={formatWinCondition(caseData.winCondition)}
              remaining={remaining}
              initial={initialAfflictionRef.current ?? remaining}
              tier={caseData.tier}
              hints={engine === "sql" ? caseData.hints?.sql : caseData.hints?.python}
              onHintRevealed={setHintsUsed}
            />
          </div>
          <div className={styles.editorPane}>
            <CodeEditor
              ref={codeEditorRef}
              initialValue={
                engine === "sql" ? caseData.starterCode.sql : caseData.starterCode.python
              }
              language={engine === "sql" ? "sql" : "python"}
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
              isRunning={isRunning}
              onRun={() => {
                void handleRun();
              }}
              buttonRef={runButtonRef}
            />
          </div>
          <div className={styles.consolePane}>
            <DiffConsole entries={consoleEntries} />
          </div>
        </div>
        <div className={styles.battlefield} ref={battlefieldRef}>
          <HpHeatmap grid={grid} winCondition={caseData.winCondition} />
          <div className={styles.gridWrap}>
            <DataframeGrid
              ref={gridRef}
              grid={grid}
              afflictionCellMap={cellMap}
              textScale={TEXT_SCALES[a11y.textScaleIndex] ?? 1}
              columnHints={caseData.columnHints}
            />
          </div>
        </div>
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
      {showVictory ? (
        <VictoryPanel
          kicker={worldMeta(world).clearedLabel}
          bossName={caseData.strings.title}
          runCount={runCount}
          cellsCleared={initialAfflictionRef.current ?? 0}
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
