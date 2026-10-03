import type { CompletionContext, CompletionResult } from "@codemirror/autocomplete";

const PANDAS_METHODS: [string, string][] = [
  ["head", "first rows"],
  ["tail", "last rows"],
  ["isna", "True where a value is missing"],
  ["notna", "True where a value is present"],
  ["sum", "add up"],
  ["mean", "average"],
  ["median", "middle value"],
  ["min", "smallest"],
  ["max", "largest"],
  ["count", "non-missing values"],
  ["nunique", "number of distinct values"],
  ["unique", "the distinct values"],
  ["value_counts", "how often each value appears"],
  ["describe", "summary statistics"],
  ["fillna", "replace missing values"],
  ["dropna", "remove rows with missing values"],
  ["drop_duplicates", "remove repeated rows"],
  ["duplicated", "True for repeated rows"],
  ["astype", "change the type"],
  ["clip", "limit values to a range"],
  ["replace", "swap values"],
  ["rename", "rename columns"],
  ["drop", "remove columns or rows"],
  ["sort_values", "sort rows"],
  ["reset_index", "renumber the rows"],
  ["merge", "join with another table"],
  ["melt", "wide to long"],
  ["pivot", "long to wide"],
  ["groupby", "group rows"],
  ["apply", "run a function on each value"],
  ["str.strip", "remove surrounding spaces"],
  ["str.lower", "lower case"],
  ["str.upper", "upper case"],
  ["str.title", "Title Case"],
  ["str.replace", "replace text (regex=True for patterns)"],
  ["str.extract", "pull out the part matching a (group)"],
  ["str.contains", "True where text matches"],
];

const PYTHON_WORDS: [string, string][] = [
  ["pd.to_numeric", "convert to numbers"],
  ["pd.to_datetime", "convert to dates"],
  ["pd.json_normalize", "flatten nested data"],
  ["pd.concat", "stack or place side by side"],
  ["import json", "needed for json.loads"],
  ["json.loads", "parse JSON text"],
  ["print", "show a value"],
  ["len", "count the items"],
];

export function pythonCompletionSource(
  columns: string[],
  tables: string[],
): (context: CompletionContext) => CompletionResult | null {
  return (context) => {
    // df['  or  df["  : offer column names
    const inBracket = context.matchBefore(/\[\s*['"][\w ]*$/);
    if (inBracket) {
      const quoteOffset = inBracket.text.search(/['"]/) + 1;
      return {
        from: inBracket.from + quoteOffset,
        options: columns.map((label) => ({ label, type: "property", detail: "column" })),
        validFor: /^[\w ]*$/,
      };
    }
    // anything after a dot: offer pandas methods
    const afterDot = context.matchBefore(/\.[\w.]*$/);
    if (afterDot) {
      return {
        from: afterDot.from + 1,
        options: PANDAS_METHODS.map(([label, detail]) => ({
          label,
          detail,
          type: "method",
        })),
        validFor: /^[\w.]*$/,
      };
    }
    const word = context.matchBefore(/[\w.]+$/);
    if (!word || (word.from === word.to && !context.explicit)) return null;
    return {
      from: word.from,
      options: [
        { label: "df", type: "variable", detail: "your table" },
        { label: "pd", type: "namespace", detail: "pandas" },
        ...tables.map((label) => ({ label, type: "variable", detail: "table" })),
        ...PYTHON_WORDS.map(([label, detail]) => ({ label, detail, type: "function" })),
      ],
      validFor: /^[\w.]*$/,
    };
  };
}
