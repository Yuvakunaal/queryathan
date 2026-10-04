import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { Compartment, EditorState, Prec } from "@codemirror/state";
import { EditorView, keymap, placeholder } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";
import { SQLite } from "@codemirror/lang-sql";
import { pythonLanguage } from "@codemirror/lang-python";
import { pythonCompletionSource } from "./editorCompletions";
import { basicSetup } from "codemirror";
import { python } from "@codemirror/lang-python";
import { sql } from "@codemirror/lang-sql";
import { bossFightsEditorExtensions } from "./editorTheme";
import styles from "./CodeEditor.module.css";

export interface CodeEditorHandle {
  getValue(): string;
  /** Replaces the whole buffer (one undoable step). */
  setValue(text: string): void;
  /** Inserts at the cursor (or over the selection) and keeps focus in the editor. */
  insert(text: string): void;
  focus(): void;
  /**
   * What the Run button should execute, worksheet-style: the highlighted text
   * if any is selected, otherwise the whole buffer.
   */
  getRunnableText(): { text: string; isSelection: boolean };
  /** Tidies the SQL (the selection if there is one, else everything). No-op for Python. */
  format(): void;
}

/** Removes the indentation shared by every non-blank line, so a selected block of Python still parses. */
function dedent(text: string): string {
  const lines = text.split("\n");
  const indents = lines
    .filter((line) => line.trim() !== "")
    .map((line) => /^[ \t]*/.exec(line)?.[0].length ?? 0);
  const shared = indents.length > 0 ? Math.min(...indents) : 0;
  return shared > 0 ? lines.map((line) => line.slice(shared)).join("\n") : text;
}

export interface CodeEditorProps {
  initialValue: string;
  /** Which engine the player picked — a fresh CodeEditor mounts per fight, so this never changes mid-mount. */
  language: "python" | "sql";
  /** Tables the player can query, with their column names; drives autocomplete. */
  schema: Record<string, string[]>;
  /** Whether the surrounding theme is dark; switches CodeMirror's own base styles. Can change while mounted. */
  dark: boolean;
  onRun: () => void;
  /** Fires when text becomes selected or the selection is cleared. */
  onSelectionChange?: ((hasSelection: boolean) => void) | undefined;
  onEscape: () => void;
}

const themeCompartment = new Compartment();

const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(function CodeEditor(
  { initialValue, language, schema, dark, onRun, onEscape, onSelectionChange },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onRunRef = useRef(onRun);
  const onEscapeRef = useRef(onEscape);
  const onSelectionChangeRef = useRef(onSelectionChange);
  onSelectionChangeRef.current = onSelectionChange;
  onRunRef.current = onRun;
  onEscapeRef.current = onEscape;

  const handleRef = useRef<CodeEditorHandle | null>(null);

  useImperativeHandle(ref, () => {
    const api: CodeEditorHandle = {
      getValue: () => viewRef.current?.state.doc.toString() ?? "",
      setValue: (text: string) => {
        const view = viewRef.current;
        if (!view) return;
        view.dispatch({
          changes: { from: 0, to: view.state.doc.length, insert: text },
          selection: { anchor: text.length },
        });
        view.focus();
      },
      insert: (text: string) => {
        const view = viewRef.current;
        if (!view) return;
        view.dispatch(view.state.replaceSelection(text), { scrollIntoView: true });
        view.focus();
      },
      focus: () => {
        viewRef.current?.focus();
      },
      getRunnableText: () => {
        const view = viewRef.current;
        if (!view) return { text: "", isSelection: false };
        const { from: rawFrom, to } = view.state.selection.main;
        // If only indentation precedes the selection, include it: otherwise the first
        // line of a selected Python block loses its indent and the rest looks over-indented.
        const line = view.state.doc.lineAt(rawFrom);
        const from =
          view.state.sliceDoc(line.from, rawFrom).trim() === "" ? line.from : rawFrom;
        const selected = view.state.sliceDoc(from, to);
        if (selected.trim() !== "") {
          return {
            text: language === "python" ? dedent(selected) : selected,
            isSelection: true,
          };
        }
        return { text: view.state.doc.toString(), isSelection: false };
      },
      format: () => {
        const view = viewRef.current;
        if (!view || language !== "sql") return;
        const { from, to } = view.state.selection.main;
        const hasSelection = view.state.sliceDoc(from, to).trim() !== "";
        const start = hasSelection ? from : 0;
        const end = hasSelection ? to : view.state.doc.length;
        const source = view.state.sliceDoc(start, end);
        // Loaded on first use so the formatter stays out of the main bundle.
        void import("sql-formatter")
          .then(({ format: formatSql }) => {
            if (view.state.sliceDoc(start, end) !== source) return;
            const formatted = formatSql(source, {
              language: "sqlite",
              keywordCase: "upper",
              tabWidth: 2,
            });
            view.dispatch({
              changes: { from: start, to: end, insert: formatted },
              selection: { anchor: start + formatted.length },
            });
          })
          .catch(() => {
            // Unparseable SQL is left exactly as typed; running it will show the engine's own error.
          })
          .finally(() => {
            view.focus();
          });
      },
    };
    handleRef.current = api;
    return api;
  }, [language]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Prec.highest so these win over any default binding basicSetup defines.
    const runKeymap = Prec.highest(
      keymap.of([
        {
          key: "Mod-Enter",
          run: () => {
            onRunRef.current();
            return true;
          },
        },
        {
          key: "Shift-Alt-f",
          run: () => {
            handleRef.current?.format();
            return true;
          },
        },
        {
          key: "Escape",
          run: () => {
            onEscapeRef.current();
            return true;
          },
        },
      ]),
    );

    const state = EditorState.create({
      doc: initialValue,
      extensions: [
        basicSetup,
        EditorView.lineWrapping,
        EditorView.contentAttributes.of({
          "aria-label": language === "sql" ? "SQL editor" : "Python editor",
        }),
        keymap.of([indentWithTab]),
        placeholder(
          language === "sql"
            ? "Write a query here, for example: SELECT * FROM data LIMIT 10;"
            : "Write code here, for example: df.head()",
        ),
        language === "sql"
          ? sql({
              dialect: SQLite,
              schema,
              defaultTable: "data",
              upperCaseKeywords: true,
            })
          : [
              python(),
              pythonLanguage.data.of({
                autocomplete: pythonCompletionSource(
                  schema.data ?? schema.df ?? Object.values(schema)[0] ?? [],
                  Object.keys(schema).filter((name) => name !== "data" && name !== "df"),
                ),
              }),
            ],
        themeCompartment.of(bossFightsEditorExtensions(dark)),
        runKeymap,
        EditorView.updateListener.of((update) => {
          if (!update.selectionSet && !update.docChanged) return;
          const { from, to } = update.state.selection.main;
          onSelectionChangeRef.current?.(update.state.sliceDoc(from, to).trim() !== "");
        }),
      ],
    });

    const view = new EditorView({ state, parent: container });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Editor is created once on mount; initialValue only seeds it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    viewRef.current?.dispatch({
      effects: themeCompartment.reconfigure(bossFightsEditorExtensions(dark)),
    });
  }, [dark]);

  return <div className={styles.editor} ref={containerRef} />;
});

export default CodeEditor;
