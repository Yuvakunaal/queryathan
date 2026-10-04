import { describe, expect, it } from "vitest";
import { buildRankCard, rankCardText } from "./rank-card";
import { emptySaveData } from "./save";
import type { SaveData } from "./save";

describe("rank card", () => {
  it("is a friendly empty state for a fresh save", () => {
    const card = buildRankCard(emptySaveData());
    expect(card.totalCleared).toBe(0);
    expect(card.worlds.every((w) => w.rank === "Not started")).toBe(true);
    expect(rankCardText(card)).toContain("just getting started");
  });

  it("sums progress and picks the strongest world as the headline", () => {
    const save: SaveData = {
      version: 1,
      worlds: {
        "boss-fights": {
          clearedCaseIds: ["a", "b"],
          masteredTechniques: ["no_nulls"],
          xp: 100,
        },
        "the-foundry": {
          clearedCaseIds: ["c"],
          masteredTechniques: ["runtime_under", "no_nulls", "no_duplicates"],
          xp: 300,
          stamps: { c: "gold" },
        },
      },
    };
    const card = buildRankCard(save);
    expect(card.totalCleared).toBe(3);
    expect(card.totalXp).toBe(400);
    expect(card.headline).toBe("Smith, The Foundry");
    expect(card.worlds.find((w) => w.name === "The Foundry")?.goldStamps).toBe(1);
    expect(rankCardText(card)).toContain("3 cases cleared, 400 XP");
  });
});
