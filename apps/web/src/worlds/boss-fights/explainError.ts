/** The message the fight screen shows when a run exceeds the engine's time limit. */
export const TIMEOUT_PREFIX = "TimeoutError:";

export interface ErrorExplanation {
  headline: string;
  explanation: string;
}

/**
 * A short plain-English reading of an engine error, shown above the engine's
 * own unmodified message. The headline is lifted from the message itself (the
 * last "SomethingError: ..." line of a traceback, or SQLite's one line) so the
 * learner sees the part that matters without scrolling a pandas traceback.
 */
export function explainError(
  language: "python" | "sql",
  message: string,
): ErrorExplanation {
  if (message.startsWith(TIMEOUT_PREFIX)) {
    return {
      headline: message.split("\n")[0] ?? message,
      explanation:
        "The code was still running after 20 seconds, so the engine was stopped and restarted. Your table is back to its starting state, but your code is still in the editor. Slow code usually repeats work for every row: look for a loop, an apply, or a subquery that re-reads the whole table.",
    };
  }
  const lines = message.split("\n").map((line) => line.trimEnd());
  if (language === "python") {
    const errorLines = lines.filter((line) =>
      /^[A-Za-z_][\w.]*(Error|Exception):/.test(line),
    );
    const headline =
      errorLines[errorLines.length - 1] ?? lines.filter(Boolean).pop() ?? message;
    const kind = headline.split(":")[0] ?? "";
    const explanations: Record<string, string> = {
      KeyError:
        "Python could not find that name. For a table, it usually means a column name is misspelled or has the wrong capital letters.",
      NameError:
        "You used a name Python has not heard of. Check the spelling, and make sure variables are created before they are used.",
      SyntaxError:
        "Python could not read the code. Look for a missing bracket, quote or colon on the line it points to.",
      IndentationError:
        "The spaces at the start of a line do not line up. Lines inside the same block need the same indent.",
      TypeError:
        "A value was the wrong kind for what you tried to do with it, such as adding text to a number.",
      ValueError:
        "The value is the right kind but cannot be used here, for example text that is not a number being converted to one.",
      AttributeError:
        "That object has no such method or property. Check the spelling, and whether you are working with a table, a column or a single value.",
      ModuleNotFoundError:
        "That library is not available here. pandas is loaded as pd; json can be imported.",
    };
    return {
      headline,
      explanation:
        explanations[kind] ??
        "Python stopped because of the problem named above. The full details are below.",
    };
  }
  const first = lines.find(Boolean) ?? message;
  const known: [RegExp, string][] = [
    [
      /near "(or|replace)": syntax error/i,
      "SQLite has no CREATE OR REPLACE. Just write CREATE TABLE result AS SELECT ...; for the table named result, each run replaces the old one for you.",
    ],
    [
      /near "(ROW|ROWS|RANGE|PRECEDING|FOLLOWING|UNBOUNDED|CURRENT)": syntax error/i,
      "A window frame needs a number before PRECEDING or FOLLOWING, for example ROWS BETWEEN 6 PRECEDING AND CURRENT ROW (this row and the six before it).",
    ],
    [
      /near "WITH": syntax error/i,
      "WITH has to start the statement, or come right after CREATE TABLE result AS. Put a semicolon after the previous statement.",
    ],
    [
      /near "(OVER|PARTITION)": syntax error/i,
      "OVER goes right after a function, like SUM(x) OVER (PARTITION BY g ORDER BY d). Check the brackets and that the function name comes first.",
    ],
    [
      /no such table: \w+/i,
      "That table does not exist. A table or CTE name only exists for the one statement that defines it: a CTE made with WITH is gone after the semicolon, so define it again in each query. Otherwise the table is called data, and any other tables are named in the task.",
    ],
    [
      /ambiguous column name/i,
      "Two tables have a column with that name. Write it as table.column, or give each table a short alias (FROM data d JOIN other o ON ...) and use d.column or o.column.",
    ],
    [
      /misuse of aggregate/i,
      "An aggregate such as SUM or COUNT cannot be used in WHERE. Use HAVING to filter groups, or compute it in a subquery or CTE first.",
    ],
    [
      /misuse of window function/i,
      "A window function cannot go in WHERE, GROUP BY or HAVING. Compute it in a subquery or a CTE, then filter on it in the query outside.",
    ],
    [
      /do not have the same number of result columns/i,
      "Every SELECT joined with UNION, INTERSECT or EXCEPT must return the same number of columns, in the same order.",
    ],
    [
      /circular reference|recursive reference/i,
      "A recursive CTE is written WITH RECURSIVE name AS (starting rows UNION ALL rows built from name). The part after UNION ALL must refer to name exactly once, and must eventually stop producing rows.",
    ],
    [
      /syntax error/i,
      "SQLite could not read the statement. Check the spelling of the keywords, and look for a missing comma, bracket or quote near the word it names.",
    ],
    [
      /no such column/i,
      "That column does not exist in the table. Click a column chip on the left to insert its exact name.",
    ],
    [
      /no such function/i,
      "SQLite does not have that function. Check the spelling, or see the task for any extra helpers.",
    ],
    [
      /incomplete input/i,
      "The statement stops too early. It may be missing a closing bracket, quote or semicolon.",
    ],
    [
      /already exists/i,
      "A table with that name already exists. Use DROP TABLE IF EXISTS name; first, or pick another name. (A table named result is replaced automatically on every run.)",
    ],
  ];
  const match = known.find(([pattern]) => pattern.test(first));
  return {
    headline: first,
    explanation:
      match?.[1] ??
      "SQLite stopped because of the problem named above. Fix the statement on the left and run it again.",
  };
}
