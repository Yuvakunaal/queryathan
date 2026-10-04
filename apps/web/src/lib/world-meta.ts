import type { WorldId } from "@dcq/content-schema";

export interface WorldMeta {
  id: WorldId;
  number: number;
  name: string;
  tagline: string;
  lede: string;
  /** Singular noun for one case in this world, used in UI copy. */
  caseNoun: string;
  /** Verb phrase on the call-to-action of a ready case. */
  startLabel: string;
  clearedLabel: string;
  statusRailName: string;
  available: boolean;
}

export const WORLDS: readonly WorldMeta[] = [
  {
    id: "boss-fights",
    number: 1,
    name: "Boss Fights",
    tagline: "Nulls, duplicates, casing, types, outliers and dates.",
    lede: "Every boss is a messy table. Write real pandas or SQL, run it in your browser, and watch the afflicted cells clear.",
    caseNoun: "boss",
    startLabel: "Start fight",
    clearedLabel: "Boss cleared",
    statusRailName: "BOSS-FIGHTS",
    available: true,
  },
  {
    id: "the-vault",
    number: 2,
    name: "The Vault",
    tagline: "Regular expressions, extraction and broken encodings.",
    lede: "Every lock is a pattern. Use regular expressions and decoders in pandas or SQL until each column fits the shape it should have.",
    caseNoun: "lock",
    startLabel: "Pick the lock",
    clearedLabel: "Lock opened",
    statusRailName: "THE-VAULT",
    available: true,
  },
  {
    id: "the-twins",
    number: 3,
    name: "The Twins",
    tagline: "Joins, key mismatches and duplicated rows.",
    lede: "Two tables, one story. Clean the keys, pick the right join, and link them without losing or multiplying a single row.",
    caseNoun: "pair",
    startLabel: "Link the tables",
    clearedLabel: "Twins linked",
    statusRailName: "THE-TWINS",
    available: true,
  },
  {
    id: "the-architect",
    number: 4,
    name: "The Architect",
    tagline: "Pivoting, melting and nested JSON.",
    lede: "Same data, different shape. Melt wide tables long, pivot long tables wide, and flatten nested JSON until the result matches the plan.",
    caseNoun: "blueprint",
    startLabel: "Draw it up",
    clearedLabel: "Blueprint approved",
    statusRailName: "THE-ARCHITECT",
    available: true,
  },
  {
    id: "the-foundry",
    number: 5,
    name: "The Foundry",
    tagline: "Speed at scale: vectorizing, window functions and timing.",
    lede: "Correct is not enough. These jobs run on tens of thousands of rows against a stopwatch. Rewrite slow code until it finishes inside the budget, and earn a bronze, silver or gold stamp.",
    caseNoun: "job",
    startLabel: "Fire up the forge",
    clearedLabel: "Quality stamped",
    statusRailName: "THE-FOUNDRY",
    available: true,
  },
];

export function worldMeta(id: WorldId): WorldMeta {
  const meta = WORLDS.find((w) => w.id === id);
  if (!meta) throw new Error(`Unknown world: ${id}`);
  return meta;
}
