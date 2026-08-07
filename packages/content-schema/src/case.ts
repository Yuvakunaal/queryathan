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
  briefing: z.string().min(1),
});

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
  strings: caseStringsSchema,
  winCondition: winConditionSchema,
});
export type Case = z.infer<typeof caseSchema>;
