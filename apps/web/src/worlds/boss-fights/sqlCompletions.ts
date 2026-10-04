import type {
  Completion,
  CompletionContext,
  CompletionResult,
} from "@codemirror/autocomplete";
import { EXTRA_COMPLETIONS, sqlCompletionItems } from "../../lib/sqlReference";

const ITEMS = [...sqlCompletionItems(), ...EXTRA_COMPLETIONS];

/**
 * Function and clause names as you type, with how each is written and what it
 * does. Picking one inserts the ready-to-edit shape, with the cursor left
 * inside the brackets for the common one-argument cases.
 */
export function sqlFunctionCompletions(
  context: CompletionContext,
): CompletionResult | null {
  const word = context.matchBefore(/[A-Za-z_]+/);
  if (!word && !context.explicit) return null;
  if (word && word.from === word.to && !context.explicit) return null;
  if (word && word.to - word.from < 2 && !context.explicit) return null;
  return {
    from: word ? word.from : context.pos,
    options: ITEMS.map((item): Completion => {
      const info = item.detail
        ? `${item.detail}${item.example ? `\n\n${item.example}` : ""}`
        : "";
      return {
        label: item.name,
        type: "function",
        detail: item.syntax,
        ...(info ? { info } : {}),
        apply: (view, _completion, from, to) => {
          const text = item.insert;
          const cursor = text.includes("()") ? text.indexOf("()") + 1 : text.length;
          view.dispatch({
            changes: { from, to, insert: text },
            selection: { anchor: from + cursor },
          });
        },
      };
    }),
    validFor: /^[A-Za-z_]*$/,
  };
}
