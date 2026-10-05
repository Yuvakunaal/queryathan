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
  {
    id: "the-observatory",
    number: 6,
    name: "The Observatory",
    tagline: "From clean tables to answers: grouping, ranking, windows and cohorts.",
    lede: "The data is clean. Now it has to say something. Each case asks a real business question; write the query or pandas code whose answer table matches the one the observatory expects.",
    caseNoun: "question",
    startLabel: "Chart the question",
    clearedLabel: "Question answered",
    statusRailName: "THE-OBSERVATORY",
    available: true,
  },
  {
    id: "the-labyrinth",
    number: 7,
    name: "The Labyrinth",
    tagline: "CTEs, subqueries, recursion and set logic.",
    lede: "Real questions need steps. Break a problem into named stages with WITH, hunt for what is missing with anti-joins, combine and subtract sets, and follow a hierarchy to its root with recursion.",
    caseNoun: "chamber",
    startLabel: "Enter the chamber",
    clearedLabel: "Chamber cleared",
    statusRailName: "THE-LABYRINTH",
    available: true,
  },
  {
    id: "the-timekeeper",
    number: 8,
    name: "The Timekeeper",
    tagline: "Dates, calendars, time zones and change over time.",
    lede: "Time is the messiest column. Read dates written three ways, fill the days that have no data, find streaks, look up what was true on a given day, compare year over year, and move between time zones.",
    caseNoun: "clock",
    startLabel: "Wind the clock",
    clearedLabel: "Clock set",
    statusRailName: "THE-TIMEKEEPER",
    available: true,
  },
  {
    id: "the-laboratory",
    number: 9,
    name: "The Laboratory",
    tagline: "Statistics, outliers, experiments and tidy features.",
    lede: "Numbers need care. Measure centre and spread, hunt outliers, read an A/B test, bin and normalise, and fill gaps sensibly, with exactly the formulas an analyst is expected to use.",
    caseNoun: "experiment",
    startLabel: "Run the experiment",
    clearedLabel: "Result confirmed",
    statusRailName: "THE-LABORATORY",
    available: true,
  },
];

export function worldMeta(id: WorldId): WorldMeta {
  const meta = WORLDS.find((w) => w.id === id);
  if (!meta) throw new Error(`Unknown world: ${id}`);
  return meta;
}
