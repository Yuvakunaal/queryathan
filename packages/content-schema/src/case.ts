import { z } from "zod";

/**
 * Win conditions are declarative predicates evaluated by trusted engine
 * code — case JSON never contains executable code (docs/adr/0003).
 */
export const predicateSchema = z.discriminatedUnion("predicate", [
  z.object({ predicate: z.literal("no_nulls"), column: z.string() }),
  z.object({
    predicate: z.literal("no_duplicates"),
    columns: z.array(z.string()).min(1),
  }),
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

export const caseSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  world: z.enum([
    "boss-fights",
    "the-vault",
    "the-twins",
    "the-architect",
    "the-foundry",
  ]),
  datasetPath: z.string().min(1),
  datasetLicense: datasetLicenseSchema,
  strings: caseStringsSchema,
  /** The code buffer CodeEditor seeds on entry — case content, not engine logic. */
  starterCode: z.string().min(1),
  columnHints: columnHintsSchema.optional(),
  winCondition: winConditionSchema,
});
export type Case = z.infer<typeof caseSchema>;
