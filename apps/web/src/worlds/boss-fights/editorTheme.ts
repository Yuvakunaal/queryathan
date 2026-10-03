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
    // Selection is painted on a layer BEHIND the text, so nothing in the line
    // may be opaque, and these selectors must out-rank CodeMirror's own dark
    // base theme (which otherwise wins with a near-invisible #233).
    "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, & > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-content ::selection":
      {
        backgroundColor: "color-mix(in srgb, var(--w1-amber-500) 38%, transparent)",
      },
    "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground": {
      backgroundColor: "color-mix(in srgb, var(--w1-amber-500) 48%, transparent)",
    },
    ".cm-selectionMatch": {
      backgroundColor: "color-mix(in srgb, var(--w1-green-500) 24%, transparent)",
    },
    ".cm-activeLine": {
      backgroundColor: "color-mix(in srgb, var(--w1-text-primary) 6%, transparent)",
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
