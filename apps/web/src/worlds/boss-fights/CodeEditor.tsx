import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { EditorState, Prec } from "@codemirror/state";
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
}

export interface CodeEditorProps {
  initialValue: string;
  /** Which engine the player picked — a fresh CodeEditor mounts per fight, so this never changes mid-mount. */
  language: "python" | "sql";
  /** Tables the player can query, with their column names; drives autocomplete. */
  schema: Record<string, string[]>;
  onRun: () => void;
  onEscape: () => void;
}

const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(function CodeEditor(
  { initialValue, language, schema, onRun, onEscape },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onRunRef = useRef(onRun);
  const onEscapeRef = useRef(onEscape);
  onRunRef.current = onRun;
  onEscapeRef.current = onEscape;

  useImperativeHandle(
    ref,
    () => ({
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
    }),
    [],
  );

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
        bossFightsEditorExtensions,
        runKeymap,
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

  return <div className={styles.editor} ref={containerRef} />;
});

export default CodeEditor;
