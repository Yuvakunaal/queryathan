import type { WorldId } from "@dcq/content-schema";

export type PlanetKind =
  | "cratered"
  | "ringed"
  | "twin"
  | "grid"
  | "cracked"
  | "banded"
  | "maze"
  | "clock"
  | "bubbles";

/** A planet: a surface kind and two colours (light side, shadow side). */
export interface PlanetLook {
  kind: PlanetKind;
  light: string;
  dark: string;
}

export interface WorldMeta {
  id: WorldId;
  number: number;
  /** The world's own name, a place you travel to (the id stays stable for saves and links). */
  name: string;
  /** What you practise there, in two or three plain words. */
  discipline: string;
  /** One line that sets the scene. */
  epithet: string;
  /** How the world's planet is drawn. */
  planet: PlanetLook;
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
    name: "Ember Reach",
    discipline: "Data cleaning",
    epithet: "Where messy data burns and monsters guard every table.",
    planet: { kind: "cratered", light: "#ff8a4c", dark: "#6b1d0d" },
    tagline: "Nulls, duplicates, casing, types, outliers and dates.",
    lede: "Every boss is a messy table. Write real pandas or SQL, run it in your browser, and watch the afflicted cells clear.",
    caseNoun: "boss",
    startLabel: "Start fight",
    clearedLabel: "Boss cleared",
    statusRailName: "EMBER-REACH",
    available: true,
  },
  {
    id: "the-vault",
    number: 2,
    name: "Cryptara",
    discipline: "Patterns and encodings",
    epithet: "A moon of sealed ciphers, locked behind patterns.",
    planet: { kind: "ringed", light: "#c4a6ff", dark: "#2c1a5c" },
    tagline: "Regular expressions, extraction and broken encodings.",
    lede: "Every lock is a pattern. Use regular expressions and decoders in pandas or SQL until each column fits the shape it should have.",
    caseNoun: "lock",
    startLabel: "Pick the lock",
    clearedLabel: "Lock opened",
    statusRailName: "CRYPTARA",
    available: true,
  },
  {
    id: "the-twins",
    number: 3,
    name: "Geminora",
    discipline: "Joins and keys",
    epithet: "Twin worlds in one orbit, held together by a key.",
    planet: { kind: "twin", light: "#6ad0ff", dark: "#ff8fcf" },
    tagline: "Joins, key mismatches and duplicated rows.",
    lede: "Two tables, one story. Clean the keys, pick the right join, and link them without losing or multiplying a single row.",
    caseNoun: "pair",
    startLabel: "Link the tables",
    clearedLabel: "Twins linked",
    statusRailName: "GEMINORA",
    available: true,
  },
  {
    id: "the-architect",
    number: 4,
    name: "Atlas Spire",
    discipline: "Reshaping tables",
    epithet: "A tower that redraws itself from every angle.",
    planet: { kind: "grid", light: "#ffd166", dark: "#1b3a7a" },
    tagline: "Pivoting, melting and nested JSON.",
    lede: "Same data, different shape. Melt wide tables long, pivot long tables wide, and flatten nested JSON until the result matches the plan.",
    caseNoun: "blueprint",
    startLabel: "Draw it up",
    clearedLabel: "Blueprint approved",
    statusRailName: "ATLAS-SPIRE",
    available: true,
  },
  {
    id: "the-foundry",
    number: 5,
    name: "Cinderforge",
    discipline: "Speed and performance",
    epithet: "Where slow code is smelted down against a stopwatch.",
    planet: { kind: "cracked", light: "#ff6a3d", dark: "#240a05" },
    tagline: "Speed at scale: vectorizing, window functions and timing.",
    lede: "Correct is not enough. These jobs run on tens of thousands of rows against a stopwatch. Rewrite slow code until it finishes inside the budget, and earn a bronze, silver or gold stamp.",
    caseNoun: "job",
    startLabel: "Fire up the forge",
    clearedLabel: "Quality stamped",
    statusRailName: "CINDERFORGE",
    available: true,
  },
  {
    id: "the-observatory",
    number: 6,
    name: "Lumenfield",
    discipline: "Analysis and answers",
    epithet: "A sea of light where clean data finally answers back.",
    planet: { kind: "banded", light: "#fff1a8", dark: "#243a8f" },
    tagline: "From clean tables to answers: grouping, ranking, windows and cohorts.",
    lede: "The data is clean. Now it has to say something. Each case asks a real business question; write the query or pandas code whose answer table matches the one the observatory expects.",
    caseNoun: "question",
    startLabel: "Chart the question",
    clearedLabel: "Question answered",
    statusRailName: "LUMENFIELD",
    available: true,
  },
  {
    id: "the-labyrinth",
    number: 7,
    name: "Minos Deep",
    discipline: "CTEs and recursion",
    epithet: "A maze with no straight line, only the next turn.",
    planet: { kind: "maze", light: "#ff5c7a", dark: "#2a0a14" },
    tagline: "CTEs, subqueries, recursion and set logic.",
    lede: "Real questions need steps. Break a problem into named stages with WITH, hunt for what is missing with anti-joins, combine and subtract sets, find unbroken streaks, and follow a hierarchy or a parts list to its root with recursion.",
    caseNoun: "chamber",
    startLabel: "Enter the chamber",
    clearedLabel: "Chamber cleared",
    statusRailName: "MINOS-DEEP",
    available: true,
  },
  {
    id: "the-timekeeper",
    number: 8,
    name: "Chronopolis",
    discipline: "Dates and time",
    epithet: "A city built inside a clock that never quite agrees with itself.",
    planet: { kind: "clock", light: "#c8f542", dark: "#26330a" },
    tagline: "Dates, calendars, time zones and change over time.",
    lede: "Time is the messiest column. Read dates written three ways, count business days, move between time zones, fill the days that have no data, look up what was true on a given day, and merge overlapping time blocks.",
    caseNoun: "clock",
    startLabel: "Wind the clock",
    clearedLabel: "Clock set",
    statusRailName: "CHRONOPOLIS",
    available: true,
  },
  {
    id: "the-laboratory",
    number: 9,
    name: "Helix-9",
    discipline: "Statistics and experiments",
    epithet: "A lab station at the edge of the map, where every number is tested.",
    planet: { kind: "bubbles", light: "#46ecd2", dark: "#06302b" },
    tagline: "Statistics, outliers, experiments and regression.",
    lede: "Numbers need care. Measure centre and spread, hunt outliers with z-scores, fill gaps sensibly, group ages into bands, read an A/B test and fit a regression line, with exactly the formulas an analyst is expected to use.",
    caseNoun: "experiment",
    startLabel: "Run the experiment",
    clearedLabel: "Result confirmed",
    statusRailName: "HELIX-9",
    available: true,
  },
];

export function worldMeta(id: WorldId): WorldMeta {
  const meta = WORLDS.find((w) => w.id === id);
  if (!meta) throw new Error(`Unknown world: ${id}`);
  return meta;
}
