/**
 * What is known about the player's most recent run, for rules that judge the
 * run itself rather than the table it left behind (World 5's runtime budget).
 */
export interface RunContext {
  /** Milliseconds the last run of the player's code took, or null if nothing has run yet. */
  elapsedMs: number | null;
  engine: "python" | "sql" | null;
}

export const NO_RUN: RunContext = { elapsedMs: null, engine: null };
