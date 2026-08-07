import { describe, expect, it } from "vitest";
import { caseSchema } from "./case";

const validCase = {
  id: "tutorial-nulls",
  world: "boss-fights",
  datasetPath: "/datasets/world-1/tutorial-nulls.csv",
  strings: {
    title: "The Null Hydra",
    briefing: "Every missing value regenerates the boss. Clear them all.",
  },
  winCondition: {
    all: [{ predicate: "no_nulls", column: "email" }],
  },
};

describe("caseSchema", () => {
  it("accepts a valid case", () => {
    expect(caseSchema.safeParse(validCase).success).toBe(true);
  });

  it("rejects an id with invalid characters", () => {
    const result = caseSchema.safeParse({ ...validCase, id: "Tutorial Nulls!" });
    expect(result.success).toBe(false);
  });

  it("rejects a win condition with no predicates", () => {
    const result = caseSchema.safeParse({ ...validCase, winCondition: { all: [] } });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown world", () => {
    const result = caseSchema.safeParse({ ...validCase, world: "the-underworld" });
    expect(result.success).toBe(false);
  });
});
