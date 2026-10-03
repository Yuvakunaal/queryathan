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
      /syntax error/i,
      "SQLite could not read the statement. Check the spelling of the keywords, and look for a missing comma, bracket or quote near the word it names.",
    ],
    [
      /no such column/i,
      "That column does not exist in the table. Click a column chip on the left to insert its exact name.",
    ],
    [
      /no such table/i,
      "That table does not exist. The data is in a table named data, and any other tables are named in the task.",
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
      "A table with that name already exists. Use DROP TABLE name; first, or pick another name.",
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
