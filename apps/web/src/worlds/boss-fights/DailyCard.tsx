import { useEffect, useState } from "react";
import type { Case, WorldId } from "@dcq/content-schema";
import { casePath, loadCase, loadRoster } from "../../lib/load-case";
import { currentStreak, dateKey, pickDaily } from "../../lib/daily";
import type { DailyCandidate, StreakState } from "../../lib/daily";
import { getWorldProgress } from "../../lib/save";
import type { SaveData } from "../../lib/save";
import { WORLDS } from "../../lib/world-meta";
import styles from "./DailyCard.module.css";

export interface DailyCardProps {
  saveData: SaveData;
  streak: StreakState;
  onPlay: (world: WorldId, path: string) => void;
}

interface Pick {
  world: WorldId;
  worldName: string;
  path: string;
  caseData: Case;
}

/**
 * "Today's case": one playable case chosen from the date alone, so everyone
 * sees the same one without a server. It only ever offers a case that is
 * already unlocked (the next uncleared case in each world), and falls back to
 * any case once everything is cleared. Fails quietly if content cannot load.
 */
export default function DailyCard({ saveData, streak, onPlay }: DailyCardProps) {
  const [pick, setPick] = useState<Pick | null>(null);
  const today = dateKey(new Date());
  const days = currentStreak(streak, today);

  useEffect(() => {
    const live = { current: true, ok: () => live.current };
    void (async () => {
      try {
        const open: DailyCandidate[] = [];
        const all: DailyCandidate[] = [];
        for (const meta of WORLDS.filter((w) => w.available)) {
          const roster = await loadRoster(meta.id);
          const cleared = new Set(getWorldProgress(saveData, meta.id).clearedCaseIds);
          for (const caseId of roster.caseIds) all.push({ world: meta.id, caseId });
          const next = roster.caseIds.find((id) => !cleared.has(id));
          if (next) open.push({ world: meta.id, caseId: next });
        }
        const chosen = pickDaily(open.length > 0 ? open : all, today);
        if (!chosen || !live.ok()) return;
        const path = casePath(chosen.world, chosen.caseId);
        const caseData = await loadCase(path);
        const worldName = WORLDS.find((w) => w.id === chosen.world)?.name ?? "";
        if (live.ok()) setPick({ world: chosen.world, worldName, path, caseData });
      } catch {
        // No daily card is better than a broken one; the worlds below still work.
      }
    })();
    return () => {
      live.current = false;
    };
    // The pick depends on which cases are cleared, not on XP or stamps changing.
  }, [saveData, today]);

  if (!pick) return null;
  return (
    <button
      type="button"
      className={styles.card}
      data-daily-card
      onClick={() => {
        onPlay(pick.world, pick.path);
      }}
    >
      <span className={styles.kicker}>Today&apos;s case</span>
      <span className={styles.title}>{pick.caseData.strings.title}</span>
      <span className={styles.meta}>
        {pick.worldName}
        {pick.caseData.strings.subtitle ? ` · ${pick.caseData.strings.subtitle}` : ""}
      </span>
      <span className={styles.foot}>
        {days > 0
          ? `${String(days)}-day streak. Clear any case today to keep it.`
          : "Clear any case today to start a streak."}
      </span>
    </button>
  );
}
