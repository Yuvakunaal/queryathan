import { useEffect, useRef, useState } from "react";
import type { Case, WorldId } from "@dcq/content-schema";
import { casePath, loadCase, loadRoster } from "../../lib/load-case";
import {
  getWorldProgress,
  rankForWorld,
  exportSaveAsJson,
  importSaveFromJson,
} from "../../lib/save";
import type { SaveData } from "../../lib/save";
import { predicateKindOrder } from "../../lib/affliction-cells";
import { BADGE_GLYPH } from "./afflictionPresentation";
import { classNames } from "../../lib/classNames";
import styles from "./WorldMapScreen.module.css";

export interface WorldMapScreenProps {
  world: WorldId;
  saveData: SaveData;
  onSelectCase: (casePath: string) => void;
  onImportSave: (save: SaveData) => void;
}

type RosterStatus = "cleared" | "unlocked" | "locked";

export default function WorldMapScreen({
  world,
  saveData,
  onSelectCase,
  onImportSave,
}: WorldMapScreenProps) {
  const [cases, setCases] = useState<Case[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);
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

  const progress = getWorldProgress(saveData, world);
  const clearedIds = new Set(progress.clearedCaseIds);
  const masteredCount = progress.masteredTechniques.length;
  const rankLabel = rankForWorld(world, masteredCount);

  function statusFor(index: number, caseItem: Case): RosterStatus {
    if (clearedIds.has(caseItem.id)) return "cleared";
    if (index === 0) return "unlocked";
    const previous = cases?.[index - 1];
    if (previous && clearedIds.has(previous.id)) return "unlocked";
    return "locked";
  }

  function handleExport(): void {
    const blob = new Blob([exportSaveAsJson(saveData)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "dcq-save.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function handleImportFile(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      const imported = importSaveFromJson(text);
      if (imported) {
        onImportSave(imported);
        const importedProgress = getWorldProgress(imported, world);
        setImportStatus({
          kind: "success",
          message: `SAVE IMPORTED — RANK: ${rankForWorld(world, importedProgress.masteredTechniques.length)}`,
        });
      } else {
        setImportStatus({ kind: "error", message: "IMPORT FAILED — INVALID SAVE FILE" });
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className={styles.roster} data-world="boss-fights">
      <h1 className={styles.rosterHeading}>Boss-Fights // World Roster</h1>

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
                  <span className={styles.rosterName}>{caseItem.strings.title}</span>
                ) : (
                  <button
                    type="button"
                    className={classNames(styles.rosterName, styles.rosterNameButton)}
                    onClick={() => {
                      onSelectCase(casePath(world, caseItem.id));
                    }}
                  >
                    {caseItem.strings.title}
                  </button>
                )}
                <span className={styles.rosterTier}>{caseItem.tier}</span>
                <span className={styles.rosterGlyphs} aria-hidden="true">
                  {kinds.map((kind) => BADGE_GLYPH[kind]).join(" ")}
                </span>
                <span className={styles.rosterTag}>
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
          <span className={styles.rankProgress}>({masteredCount} / 6 techniques)</span>
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
      {importStatus ? (
        <div
          className={classNames(
            styles.importStatus,
            importStatus.kind === "error" && styles.importStatusError,
          )}
          aria-live="polite"
        >
          {importStatus.message}
        </div>
      ) : null}
    </div>
  );
}
