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

  it("explains the window frame mistake from the CTE screenshot", () => {
    const r = explainError("sql", 'near "ROW": syntax error');
    expect(r.explanation).toContain("needs a number before PRECEDING");
    expect(explainError("sql", 'near "PRECEDING": syntax error').explanation).toContain(
      "6 PRECEDING",
    );
  });

  it("explains a CTE name used after its statement ended", () => {
    const r = explainError("sql", "no such table: cte");
    expect(r.explanation).toContain("gone after the semicolon");
  });

  it("explains the other common SQL slips", () => {
    expect(explainError("sql", "ambiguous column name: id").explanation).toContain(
      "table.column",
    );
    expect(explainError("sql", "misuse of aggregate: SUM()").explanation).toContain(
      "HAVING",
    );
    expect(
      explainError("sql", "misuse of window function row_number()").explanation,
    ).toContain("subquery or a CTE");
    expect(
      explainError(
        "sql",
        "SELECTs to the left and right of UNION do not have the same number of result columns",
      ).explanation,
    ).toContain("same number of columns");
    expect(explainError("sql", 'near "WITH": syntax error').explanation).toContain(
      "start the statement",
    );
  });
});
