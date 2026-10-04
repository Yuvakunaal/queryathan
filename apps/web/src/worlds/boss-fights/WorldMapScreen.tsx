import { useEffect, useRef, useState } from "react";
import type { Case, WorldId } from "@dcq/content-schema";
import { casePath, loadCase, loadRoster } from "../../lib/load-case";
import {
  getWorldProgress,
  maxTechniquesForWorld,
  rankForWorld,
  exportSaveAsJson,
  importSaveFromJson,
} from "../../lib/save";
import type { SaveData } from "../../lib/save";
import type { A11yState } from "../../lib/a11y";
import { predicateKindOrder } from "../../lib/affliction-cells";
import { BADGE_GLYPH } from "./afflictionPresentation";
import { renderSigil } from "./sigil";
import { classNames } from "../../lib/classNames";
import { worldMeta } from "../../lib/world-meta";
import A11yControls from "./A11yControls";
import styles from "./WorldMapScreen.module.css";

export interface WorldMapScreenProps {
  world: WorldId;
  saveData: SaveData;
  a11y: A11yState;
  onA11yChange: (next: A11yState) => void;
  onBack: () => void;
  onSelectCase: (casePath: string) => void;
  onImportSave: (save: SaveData) => void;
}

type RosterStatus = "cleared" | "unlocked" | "locked";

const IMPORT_STATUS_DURATION_MS = 4000;

export default function WorldMapScreen({
  world,
  saveData,
  a11y,
  onA11yChange,
  onBack,
  onSelectCase,
  onImportSave,
}: WorldMapScreenProps) {
  const meta = worldMeta(world);
  const [cases, setCases] = useState<Case[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const importStatusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load(): Promise<void> {
      try {
        const roster = await loadRoster(world);
        const loaded = await Promise.all(
          roster.caseIds.map((id) => loadCase(casePath(world, id))),
        );
        if (!cancelled) setCases(loaded);
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : String(err));
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [world]);

  useEffect(() => {
    return () => {
      if (importStatusTimeoutRef.current) clearTimeout(importStatusTimeoutRef.current);
    };
  }, []);

  const progress = getWorldProgress(saveData, world);
  const clearedIds = new Set(progress.clearedCaseIds);
  const masteredCount = progress.masteredTechniques.length;
  const rankLabel = rankForWorld(world, masteredCount);
  const maxTechniques = maxTechniquesForWorld(world);

  function statusFor(index: number, caseItem: Case): RosterStatus {
    if (clearedIds.has(caseItem.id)) return "cleared";
    if (index === 0) return "unlocked";
    const previous = cases?.[index - 1];
    if (previous && clearedIds.has(previous.id)) return "unlocked";
    return "locked";
  }

  /** Always-mounted live region content, cleared on a timer — an element that only *appears* when there's something to say is commonly missed by screen readers, since the region has to exist before its text changes for most of them to pick up the mutation. */
  function announce(message: string, durationMs?: number): void {
    if (importStatusTimeoutRef.current) clearTimeout(importStatusTimeoutRef.current);
    setStatusMessage(message);
    if (durationMs !== undefined) {
      importStatusTimeoutRef.current = setTimeout(() => {
        setStatusMessage("");
      }, durationMs);
    }
  }

  function handleExport(): void {
    const blob = new Blob([exportSaveAsJson(saveData)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "dcq-save.json";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 0);
    announce("SAVE EXPORTED — dcq-save.json", IMPORT_STATUS_DURATION_MS);
  }

  function handleImportFile(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      const imported = importSaveFromJson(text);
      if (imported) {
        onImportSave(imported);
        const importedProgress = getWorldProgress(imported, world);
        announce(
          `SAVE IMPORTED — RANK: ${rankForWorld(world, importedProgress.masteredTechniques.length)}`,
          IMPORT_STATUS_DURATION_MS,
        );
      } else {
        announce("IMPORT FAILED — INVALID SAVE FILE", IMPORT_STATUS_DURATION_MS);
      }
    };
    reader.readAsText(file);
  }

  const statusIsError = statusMessage.startsWith("IMPORT FAILED");
  const rankPercent =
    maxTechniques > 0 ? Math.round((masteredCount / maxTechniques) * 100) : 0;
  const clearedCount = clearedIds.size;

  return (
    <div className={styles.roster} data-world={world}>
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <span className={styles.brand}>
            <span className={styles.brandMark} aria-hidden="true">
              &gt;_
            </span>
            <button type="button" className={styles.backLink} onClick={onBack}>
              Data Cleaning Quest
            </button>
          </span>
          <A11yControls a11y={a11y} onChange={onA11yChange} />
        </header>

        <section className={styles.hero}>
          <div>
            <p className={styles.worldTag}>World {meta.number}</p>
            <h1 className={styles.rosterHeading}>{meta.name}</h1>
            <p className={styles.lede}>{meta.lede}</p>
          </div>
          <div className={styles.rankPanel}>
            <div className={styles.rankTop}>
              <span className={styles.rankLabel}>Rank</span>
              <span className={styles.rankValue}>{rankLabel}</span>
            </div>
            <div
              className={styles.rankTrack}
              role="progressbar"
              aria-label="Techniques mastered"
              aria-valuemin={0}
              aria-valuemax={maxTechniques}
              aria-valuenow={masteredCount}
            >
              <div
                className={styles.rankFill}
                style={{ width: `${String(rankPercent)}%` }}
              />
            </div>
            <div className={styles.rankMeta}>
              <span>
                {masteredCount} / {maxTechniques} techniques
              </span>
              <span>{progress.xp} XP</span>
            </div>
          </div>
        </section>

        {loadError ? (
          <div className={styles.loadError} role="alert">
            Could not load the roster: {loadError}. Reload the page to try again.
          </div>
        ) : null}

        {!cases && !loadError ? (
          <div className={styles.loading} role="status" aria-live="polite">
            Loading...
          </div>
        ) : null}

        {cases ? (
          <ul className={styles.grid}>
            {cases.map((caseItem, index) => {
              const status = statusFor(index, caseItem);
              const kinds = predicateKindOrder(caseItem.winCondition);
              const isLocked = status === "locked";
              const sigil = renderSigil(isLocked || status === "unlocked" ? 1 : 0, 1);
              const label = `${caseItem.strings.title}, ${caseItem.tier}, ${status}, techniques: ${kinds.join(", ")}`;
              const body = (
                <>
                  <div className={styles.cardHead}>
                    <span className={styles.cardTier}>{caseItem.tier}</span>
                    {progress.stamps?.[caseItem.id] ? (
                      <span
                        className={styles.cardStamp}
                        data-stamp={progress.stamps[caseItem.id]}
                      >
                        {progress.stamps[caseItem.id]}
                      </span>
                    ) : null}
                    <span className={styles.cardStatus} data-status={status}>
                      {status === "cleared" ? "Cleared" : isLocked ? "Locked" : "Ready"}
                    </span>
                  </div>
                  <pre className={styles.sigil} aria-hidden="true">
                    {sigil}
                  </pre>
                  <h2 className={styles.cardTitle}>{caseItem.strings.title}</h2>
                  {caseItem.strings.subtitle ? (
                    <p className={styles.cardSub}>{caseItem.strings.subtitle}</p>
                  ) : null}
                  <ul className={styles.chips} aria-hidden="true">
                    {kinds.map((kind) => (
                      <li key={kind} className={styles.chip} data-kind={kind}>
                        <span className={styles.chipGlyph}>{BADGE_GLYPH[kind]}</span>
                        {kind}
                      </li>
                    ))}
                  </ul>
                  <span className={styles.cardCta} aria-hidden="true">
                    {status === "cleared"
                      ? "Play again"
                      : isLocked
                        ? `Clear the previous ${meta.caseNoun}`
                        : meta.startLabel}
                  </span>
                </>
              );
              return (
                <li
                  key={caseItem.id}
                  className={styles.cardItem}
                  style={{ "--i": index } as React.CSSProperties}
                >
                  {isLocked ? (
                    <div
                      className={styles.card}
                      data-status={status}
                      aria-label={label}
                      role="group"
                    >
                      {body}
                    </div>
                  ) : (
                    <button
                      type="button"
                      className={classNames(styles.card, styles.cardButton)}
                      data-status={status}
                      aria-label={label}
                      onClick={() => {
                        onSelectCase(casePath(world, caseItem.id));
                      }}
                    >
                      {body}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        ) : null}

        <footer className={styles.footer}>
          <span className={styles.footerNote}>
            {cases
              ? `${String(clearedCount)} of ${String(cases.length)} ${meta.caseNoun}s cleared. `
              : ""}
            Progress is saved in this browser. Export it to move devices.
          </span>
          <div className={styles.saveControls}>
            <button type="button" className={styles.saveButton} onClick={handleExport}>
              Export save
            </button>
            <button
              type="button"
              className={styles.saveButton}
              onClick={() => {
                fileInputRef.current?.click();
              }}
            >
              Import save
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className={styles.hiddenFileInput}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) handleImportFile(file);
                event.target.value = "";
              }}
            />
          </div>
        </footer>
        <div
          className={classNames(
            styles.importStatus,
            statusIsError && styles.importStatusError,
          )}
          aria-live="polite"
        >
          {statusMessage}
        </div>
      </div>
    </div>
  );
}
