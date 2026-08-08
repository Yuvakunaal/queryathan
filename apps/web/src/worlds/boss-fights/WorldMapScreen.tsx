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
import { classNames } from "../../lib/classNames";
import A11yControls from "./A11yControls";
import styles from "./WorldMapScreen.module.css";

export interface WorldMapScreenProps {
  world: WorldId;
  saveData: SaveData;
  a11y: A11yState;
  onA11yChange: (next: A11yState) => void;
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
  onSelectCase,
  onImportSave,
}: WorldMapScreenProps) {
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

  return (
    <div className={styles.roster} data-world="boss-fights">
      <div className={styles.rosterHeader}>
        <h1 className={styles.rosterHeading}>Boss-Fights // World Roster</h1>
        <A11yControls a11y={a11y} onChange={onA11yChange} />
      </div>

      {loadError ? (
        <div className={styles.loadError} role="alert">
          failed to load roster — {loadError}
        </div>
      ) : null}

      {!cases && !loadError ? (
        <div className={styles.loading} role="status" aria-live="polite">
          loading roster...
        </div>
      ) : null}

      {cases ? (
        <div role="list">
          {cases.map((caseItem, index) => {
            const status = statusFor(index, caseItem);
            const kinds = predicateKindOrder(caseItem.winCondition);
            const isLocked = status === "locked";
            const glyphPreview = kinds.map((kind) => BADGE_GLYPH[kind]).join(" ");
            return (
              <div
                key={caseItem.id}
                role="listitem"
                className={styles.rosterRow}
                data-status={status}
              >
                <span
                  className={styles.rosterStatus}
                  data-status={status}
                  aria-hidden="true"
                >
                  {status === "cleared" ? "[X]" : status === "unlocked" ? "[>]" : "[ ]"}
                </span>
                {isLocked ? (
                  <span
                    className={styles.rosterName}
                    aria-label={`${caseItem.strings.title}, ${caseItem.tier}, locked`}
                  >
                    {caseItem.strings.title}
                  </span>
                ) : (
                  <button
                    type="button"
                    className={classNames(styles.rosterName, styles.rosterNameButton)}
                    aria-label={`${caseItem.strings.title}, ${caseItem.tier}, ${status === "cleared" ? "cleared" : "unlocked"}, techniques: ${kinds.join(", ")}`}
                    onClick={() => {
                      onSelectCase(casePath(world, caseItem.id));
                    }}
                  >
                    {caseItem.strings.title}
                  </button>
                )}
                <span className={styles.rosterTier} aria-hidden="true">
                  {caseItem.tier}
                </span>
                <span
                  className={styles.rosterGlyphs}
                  aria-hidden="true"
                  title={glyphPreview}
                >
                  {glyphPreview}
                </span>
                <span className={styles.rosterTag} aria-hidden="true">
                  {status === "cleared" ? "CLEARED" : status === "locked" ? "LOCKED" : ""}
                </span>
              </div>
            );
          })}
        </div>
      ) : null}

      <div className={styles.rankReadout}>
        <span>
          <span className={styles.rankLabel}>RANK</span>
          <span className={styles.rankValue}>{rankLabel}</span>
          <span className={styles.rankProgress}>
            ({masteredCount} / {maxTechniques} techniques)
          </span>
        </span>
        <span>
          <span className={styles.rankLabel}>XP</span>
          <span className={styles.rankValue}>{progress.xp}</span>
        </span>
      </div>

      <div className={styles.saveControls}>
        <button type="button" className={styles.saveButton} onClick={handleExport}>
          Export Save
        </button>
        <button
          type="button"
          className={styles.saveButton}
          onClick={() => {
            fileInputRef.current?.click();
          }}
        >
          Import Save
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
  );
}
