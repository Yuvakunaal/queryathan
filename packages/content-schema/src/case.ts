import { z } from "zod";

/**
 * Win conditions are declarative predicates evaluated by trusted engine
 * code — case JSON never contains executable code (docs/adr/0003).
 */
export const dtypeSchema = z.enum(["int", "float", "bool", "string", "datetime"]);
export type Dtype = z.infer<typeof dtypeSchema>;

export const casingSchema = z.enum(["lower", "upper", "title"]);
export type Casing = z.infer<typeof casingSchema>;

function isValidRegex(pattern: string): boolean {
  try {
    new RegExp(pattern);
    return true;
  } catch {
    return false;
  }
}

export const predicateSchema = z.discriminatedUnion("predicate", [
  z.object({ predicate: z.literal("no_nulls"), column: z.string() }),
  z.object({
    predicate: z.literal("no_duplicates"),
    columns: z.array(z.string()).min(1),
  }),
  z.object({ predicate: z.literal("no_whitespace"), column: z.string() }),
  z.object({
    predicate: z.literal("consistent_casing"),
    column: z.string(),
    case: casingSchema,
  }),
  z.object({
    predicate: z.literal("valid_dtype"),
    column: z.string(),
    dtype: dtypeSchema,
  }),
  z.object({
    predicate: z.literal("no_outliers"),
    column: z.string(),
    min: z.number(),
    max: z.number(),
  }),
  /** Every non-null cell must match `pattern` (JavaScript RegExp syntax; write ^...$ for a full match). */
  z.object({
    predicate: z.literal("matches_pattern"),
    column: z.string(),
    pattern: z.string().refine(isValidRegex, "pattern is not a valid regular expression"),
  }),
  /** The whole result must have exactly `equals` rows (World 3: a join must not lose or multiply rows). */
  z.object({ predicate: z.literal("row_count"), equals: z.number().int().min(0) }),
  /** Every listed column must exist in the result (World 3: a join must bring the other table's columns across). */
  z.object({ predicate: z.literal("has_columns"), columns: z.array(z.string()).min(1) }),
  /** No cell may contain UTF-8-read-as-Latin-1 garbage such as "Ã©" or "â€™". */
  z.object({ predicate: z.literal("no_mojibake"), column: z.string() }),
]);
export type Predicate = z.infer<typeof predicateSchema>;

export const winConditionSchema = z.object({
  all: z.array(predicateSchema).min(1),
});
export type WinCondition = z.infer<typeof winConditionSchema>;

/** Display strings live separately from logic so translations don't touch case behavior. */
export const caseStringsSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().min(1).optional(),
  briefing: z.string().min(1),
});

/**
 * Plan §8: every seed dataset's license/provenance must be documented in
 * the case JSON metadata, not only in the world's LICENSES.md — the latter
 * stays as the human-readable index, this is the machine-checkable copy.
 */
export const datasetLicenseSchema = z.object({
  license: z.string().min(1),
  provenance: z.string().min(1),
});
export type DatasetLicense = z.infer<typeof datasetLicenseSchema>;

/** Optional per-column display hints — a case with no hints for a column falls back to sane defaults. */
export const columnHintSchema = z.object({
  widthPx: z.number().int().positive().optional(),
  numeric: z.boolean().optional(),
});
export const columnHintsSchema = z.record(z.string(), columnHintSchema);
export type ColumnHints = z.infer<typeof columnHintsSchema>;

export const worldIdSchema = z.enum([
  "boss-fights",
  "the-vault",
  "the-twins",
  "the-architect",
  "the-foundry",
]);
export type WorldId = z.infer<typeof worldIdSchema>;

/**
 * Drives both the world-map roster display and the "no hints, one shot"
 * framing (plan §6): a final-boss case's UI withholds the objective
 * checklist and any starter-code scaffold that a tutorial/mid-boss gets.
 * "one shot" is an honest tone/framing choice, not an anti-cheat
 * mechanism — nothing here actually prevents re-running code.
 */
export const caseTierSchema = z.enum(["tutorial", "mid-boss", "final-boss"]);
export type CaseTier = z.infer<typeof caseTierSchema>;

/**
 * One buffer per engine (Phase 3, plan's dual-engine requirement) — a case's
 * starter code is language-specific, not translatable at runtime, so both
 * variants are authored explicitly rather than one being derived.
 */
export const starterCodeSchema = z.object({
  python: z.string().min(1),
  sql: z.string().min(1),
});
export type StarterCode = z.infer<typeof starterCodeSchema>;

/** Progressive hints, revealed one at a time per engine. Never shown for final-boss cases. */
export const hintsSchema = z.object({
  python: z.array(z.string().min(1)),
  sql: z.array(z.string().min(1)),
});
export type Hints = z.infer<typeof hintsSchema>;

/** A second CSV loaded beside the main dataset, available to the player as a DataFrame / table with this name. */
export const extraTableSchema = z.object({
  name: z.string().regex(/^[a-z_][a-z0-9_]*$/),
  path: z.string().min(1),
});
export type ExtraTableSpec = z.infer<typeof extraTableSchema>;

export const caseSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  world: worldIdSchema,
  tier: caseTierSchema,
  datasetPath: z.string().min(1),
  /** Reference tables the player can join against (World 3). The main dataset stays `df` / `data`. */
  extraTables: z.array(extraTableSchema).optional(),
  datasetLicense: datasetLicenseSchema,
  strings: caseStringsSchema,
  /** The code buffer CodeEditor seeds on entry, per engine — case content, not engine logic. Ignored for final-boss cases (plan §6's "no hints, one shot"). */
  starterCode: starterCodeSchema,
  columnHints: columnHintsSchema.optional(),
  hints: hintsSchema.optional(),
  winCondition: winConditionSchema,
});
export type Case = z.infer<typeof caseSchema>;

/**
 * Authorial ordering of a world's bosses — deliberately a content file
 * (not inferred from a directory listing, which has no defined order) so
 * the sequence players fight through is a reviewable authoring decision.
 */
export const worldRosterSchema = z.object({
  world: worldIdSchema,
  caseIds: z.array(z.string().regex(/^[a-z0-9-]+$/)).min(1),
});
export type WorldRoster = z.infer<typeof worldRosterSchema>;
