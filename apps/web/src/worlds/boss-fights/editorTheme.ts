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
    "&.cm-focused": {
      outline: "none",
    },
    ".cm-content": {
      caretColor: "var(--w1-green-500)",
      lineHeight: "1.65",
      padding: "10px 0",
    },
    ".cm-line": {
      padding: "0 12px",
    },
    ".cm-placeholder": {
      color: "var(--w1-text-dim)",
      fontStyle: "italic",
    },
    "&.cm-focused .cm-matchingBracket": {
      backgroundColor: "rgb(var(--w1-status-dup-rgb) / 0.25)",
      outline: "1px solid rgb(var(--w1-status-dup-rgb) / 0.6)",
    },
    ".cm-tooltip": {
      backgroundColor: "var(--w1-bg-panel-2)",
      border: "1px solid var(--w1-rule-strong)",
      color: "var(--w1-text-primary)",
      fontFamily: "var(--w1-font-text)",
    },
    ".cm-tooltip-autocomplete ul li": {
      padding: "3px 10px",
    },
    ".cm-tooltip-autocomplete ul li[aria-selected]": {
      backgroundColor: "var(--w1-bg-row-hover)",
      color: "var(--w1-text-primary)",
      outline: "1px solid var(--w1-amber-500)",
      outlineOffset: "-1px",
    },
    ".cm-completionDetail": {
      color: "var(--w1-text-dim)",
      fontStyle: "normal",
      marginLeft: "10px",
    },
    ".cm-completionMatchedText": {
      color: "var(--w1-amber-500)",
      textDecoration: "none",
      fontWeight: "700",
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
