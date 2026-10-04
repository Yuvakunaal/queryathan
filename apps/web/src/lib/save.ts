import { z } from "zod";
import { worldIdSchema } from "@dcq/content-schema";
import { betterStamp } from "./forge";
import { writeStored } from "./safeStorage";
import type { Stamp } from "./forge";
import type { WorldId } from "@dcq/content-schema";

const worldProgressSchema = z.object({
  clearedCaseIds: z.array(z.string()),
  masteredTechniques: z.array(z.string()),
  xp: z.number().int().min(0),
  /** Best quality stamp per case (World 5). Optional so older saves still load. */
  stamps: z.record(z.string(), z.enum(["bronze", "silver", "gold"])).optional(),
});
export type WorldProgress = z.infer<typeof worldProgressSchema>;

export const saveDataSchema = z.object({
  version: z.literal(1),
  worlds: z.record(worldIdSchema, worldProgressSchema),
});
export type SaveData = z.infer<typeof saveDataSchema>;

const STORAGE_KEY = "dcq.save";
const XP_PER_TECHNIQUE = 100;

export function emptySaveData(): SaveData {
  return { version: 1, worlds: {} };
}

export function emptyWorldProgress(): WorldProgress {
  return { clearedCaseIds: [], masteredTechniques: [], xp: 0 };
}

export function getWorldProgress(save: SaveData, world: WorldId): WorldProgress {
  return save.worlds[world] ?? emptyWorldProgress();
}

/**
 * Records a case win: marks it cleared, folds in any newly-mastered
 * technique kinds, and awards XP once per technique the FIRST time a case
 * is cleared. Re-clearing an already-cleared case updates nothing — this
 * keeps XP tied to genuinely new mastery (plan §6), not grindable by
 * re-running the same win.
 */
export function recordCaseWin(
  save: SaveData,
  world: WorldId,
  caseId: string,
  techniqueKinds: string[],
  stamp?: Stamp,
): SaveData {
  const current = getWorldProgress(save, world);
  if (current.clearedCaseIds.includes(caseId)) {
    // Re-clearing earns no XP, but a better stamp is still kept.
    const best = betterStamp(current.stamps?.[caseId], stamp);
    if (!best || best === current.stamps?.[caseId]) return save;
    return {
      ...save,
      worlds: {
        ...save.worlds,
        [world]: { ...current, stamps: { ...current.stamps, [caseId]: best } },
      },
    };
  }

  const next: WorldProgress = {
    clearedCaseIds: [...current.clearedCaseIds, caseId],
    masteredTechniques: Array.from(
      new Set([...current.masteredTechniques, ...techniqueKinds]),
    ),
    xp: current.xp + techniqueKinds.length * XP_PER_TECHNIQUE,
    ...(stamp
      ? { stamps: { ...current.stamps, [caseId]: stamp } }
      : current.stamps
        ? { stamps: current.stamps }
        : {}),
  };
  return { ...save, worlds: { ...save.worlds, [world]: next } };
}

export function loadSave(): SaveData {
  if (typeof window === "undefined") return emptySaveData();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptySaveData();
    const parsed: unknown = JSON.parse(raw);
    const result = saveDataSchema.safeParse(parsed);
    return result.success ? result.data : emptySaveData();
  } catch {
    return emptySaveData();
  }
}

export function persistSave(save: SaveData): void {
  if (typeof window === "undefined") return;
  writeStored(STORAGE_KEY, JSON.stringify(save));
}

export function exportSaveAsJson(save: SaveData): string {
  return JSON.stringify(save, null, 2);
}

/** Returns null on malformed/invalid JSON rather than throwing — callers decide how to tell the player an import failed. */
export function importSaveFromJson(json: string): SaveData | null {
  try {
    const parsed: unknown = JSON.parse(json);
    const result = saveDataSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

interface RankTier {
  label: string;
  minTechniques: number;
}

/**
 * World 1 (Boss Fights) has 6 distinct predicate types
 * (no_nulls/no_duplicates/no_whitespace/consistent_casing/valid_dtype/
 * no_outliers — see recordCaseWin's predicateKinds() argument) — ranks are
 * tied to how many are mastered, not how many cases are cleared, per plan
 * §6. Note this is predicate-type count, not affliction-*kind* count:
 * `valid_dtype` covers both "wrong dtype" and "bad dates" content
 * (dtype: "datetime" renders as its own visual kind, per
 * docs/content-authoring-guide.md, but is the same predicate type for
 * mastery-tracking purposes) — so a case that's the player's first
 * `valid_dtype("datetime")` win doesn't award a 7th technique, it's still
 * `valid_dtype`. Worlds beyond World 1 aren't built yet (Phase 2 scope is
 * "Full World 1" only), so they fall back to a single-tier rank until
 * their own techniques exist.
 */
const RANK_TIERS: Record<WorldId, RankTier[]> = {
  "boss-fights": [
    { label: "Recruit", minTechniques: 0 },
    { label: "Cleaner", minTechniques: 1 },
    { label: "Debugger", minTechniques: 3 },
    { label: "Sanitizer", minTechniques: 5 },
    { label: "Data Sentinel", minTechniques: 6 },
  ],
  "the-vault": [
    { label: "Recruit", minTechniques: 0 },
    { label: "Locksmith", minTechniques: 1 },
    { label: "Safecracker", minTechniques: 3 },
    { label: "Master Cracker", minTechniques: 5 },
  ],
  "the-twins": [
    { label: "Recruit", minTechniques: 0 },
    { label: "Matchmaker", minTechniques: 1 },
    { label: "Linker", minTechniques: 3 },
    { label: "Twin Master", minTechniques: 6 },
  ],
  "the-architect": [
    { label: "Recruit", minTechniques: 0 },
    { label: "Drafter", minTechniques: 1 },
    { label: "Designer", minTechniques: 3 },
    { label: "Architect", minTechniques: 6 },
  ],
  "the-foundry": [
    { label: "Recruit", minTechniques: 0 },
    { label: "Apprentice", minTechniques: 1 },
    { label: "Smith", minTechniques: 3 },
    { label: "Master Smith", minTechniques: 4 },
  ],
  "the-observatory": [
    { label: "Recruit", minTechniques: 0 },
    { label: "Stargazer", minTechniques: 1 },
    { label: "Navigator", minTechniques: 3 },
    { label: "Astronomer", minTechniques: 6 },
  ],
};

export function rankForWorld(world: WorldId, masteredTechniqueCount: number): string {
  const tiers = RANK_TIERS[world];
  let label = tiers[0]?.label ?? "Recruit";
  for (const tier of tiers) {
    if (masteredTechniqueCount >= tier.minTechniques) label = tier.label;
  }
  return label;
}

/** The top rank tier's threshold — how many distinct techniques a world's roster screen should show as the "/ N techniques" denominator, instead of a hardcoded number that would silently go stale for a world with a different technique count. */
export function maxTechniquesForWorld(world: WorldId): number {
  const tiers = RANK_TIERS[world];
  return tiers.reduce((max, tier) => Math.max(max, tier.minTechniques), 0);
}
