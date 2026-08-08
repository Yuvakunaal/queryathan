import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags } from "@lezer/highlight";

/** Reads the same hex values as theme.css — not a stock CodeMirror theme. */
export const bossFightsEditorTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: "var(--w1-bg-void)",
      color: "var(--w1-text-primary)",
      fontFamily: "var(--w1-font-text)",
      fontSize: "var(--w1-fs-code)",
      height: "100%",
    },
    ".cm-content": {
      caretColor: "var(--w1-green-500)",
      lineHeight: "21px",
      padding: "8px 0",
    },
    ".cm-cursor, .cm-dropCursor": {
      borderLeftColor: "var(--w1-green-500)",
      borderLeftWidth: "2px",
    },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": {
      backgroundColor: "rgb(var(--w1-status-null-rgb) / 0.22)",
    },
    ".cm-activeLine": {
      backgroundColor: "var(--w1-bg-row-hover)",
    },
    ".cm-gutters": {
      backgroundColor: "var(--w1-bg-panel-2)",
      color: "var(--w1-text-dim)",
      border: "none",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "var(--w1-bg-row-hover)",
    },
    ".cm-scroller": {
      fontFamily: "var(--w1-font-text)",
    },
  },
  { dark: true },
);

const bossFightsHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: "var(--w1-amber-500)" },
  { tag: tags.string, color: "var(--w1-green-300)" },
  { tag: tags.number, color: "var(--w1-status-null)" },
  { tag: tags.comment, color: "var(--w1-text-dim)", fontStyle: "italic" },
  {
    tag: [
      tags.function(tags.variableName),
      tags.function(tags.definition(tags.variableName)),
    ],
    color: "var(--w1-green-500)",
  },
]);

export const bossFightsEditorExtensions = [
  bossFightsEditorTheme,
  syntaxHighlighting(bossFightsHighlightStyle),
];
