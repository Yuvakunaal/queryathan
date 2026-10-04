import { WORLDS } from "./world-meta";
import { getWorldProgress, rankForWorld } from "./save";
import type { SaveData } from "./save";

export interface RankCardWorld {
  name: string;
  rank: string;
  cleared: number;
  techniques: number;
  goldStamps: number;
}

export interface RankCardModel {
  worlds: RankCardWorld[];
  totalCleared: number;
  totalXp: number;
  /** The highest-ranked world with progress, used as the card's headline. */
  headline: string;
}

/** Everything the shareable card shows, derived from the save. No names, no identifiers. */
export function buildRankCard(save: SaveData): RankCardModel {
  const worlds: RankCardWorld[] = [];
  let totalCleared = 0;
  let totalXp = 0;
  let headline = "Recruit";
  let headlineScore = -1;
  for (const meta of WORLDS) {
    if (!meta.available) continue;
    const progress = getWorldProgress(save, meta.id);
    const techniques = progress.masteredTechniques.length;
    const rank = rankForWorld(meta.id, techniques);
    const cleared = progress.clearedCaseIds.length;
    worlds.push({
      name: meta.name,
      rank: cleared > 0 ? rank : "Not started",
      cleared,
      techniques,
      goldStamps: Object.values(progress.stamps ?? {}).filter((s) => s === "gold").length,
    });
    totalCleared += cleared;
    totalXp += progress.xp;
    if (cleared > 0 && techniques > headlineScore) {
      headlineScore = techniques;
      headline = `${rank}, ${meta.name}`;
    }
  }
  return { worlds, totalCleared, totalXp, headline };
}

/** Plain-text version for pasting into a chat or post. */
export function rankCardText(card: RankCardModel): string {
  if (card.totalCleared === 0) return "Data Cleaning Quest: just getting started.";
  const lines = card.worlds
    .filter((w) => w.cleared > 0)
    .map((w) => `${w.name}: ${w.rank} (${String(w.cleared)} cleared)`);
  return [
    `Data Cleaning Quest: ${card.headline}`,
    ...lines,
    `${String(card.totalCleared)} ${card.totalCleared === 1 ? "case" : "cases"} cleared, ${String(card.totalXp)} XP`,
  ].join("\n");
}
