import { describe, expect, it } from "vitest";
import { explainError } from "./explainError";

describe("explainError", () => {
  it("uses the last Error line of a Python traceback as the headline", () => {
    const message = [
      "Traceback (most recent call last):",
      '  File "x.py", line 1, in get_loc',
      "KeyError: 'nope'",
      "",
      "The above exception was the direct cause of the following exception:",
      "",
      "Traceback (most recent call last):",
      '  File "y.py", line 2, in eval_code_async',
      "KeyError: 'nope'",
    ].join("\n");
    const result = explainError("python", message);
    expect(result.headline).toBe("KeyError: 'nope'");
    expect(result.explanation).toMatch(/misspelled/);
  });

  it("explains a SQLite syntax error and keeps its own one-line message as the headline", () => {
    const result = explainError("sql", 'near "SELEC": syntax error');
    expect(result.headline).toBe('near "SELEC": syntax error');
    expect(result.explanation).toMatch(/could not read/);
  });

  it("recognises a missing column in SQL", () => {
    expect(explainError("sql", "no such column: foo").explanation).toMatch(/column chip/);
  });

  it("falls back to a generic line for unknown Python errors", () => {
    expect(
      explainError("python", "ZeroDivisionError: division by zero").explanation,
    ).toMatch(/named above/);
  });

  it("explains CREATE OR REPLACE on a table that is not result", () => {
    const result = explainError("sql", 'near "or": syntax error');
    expect(result.explanation).toContain("no CREATE OR REPLACE");
  });
});
