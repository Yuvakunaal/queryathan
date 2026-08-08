import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { EditorState, Prec } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { basicSetup } from "codemirror";
import { python } from "@codemirror/lang-python";
import { bossFightsEditorExtensions } from "./editorTheme";
import styles from "./CodeEditor.module.css";

export interface CodeEditorHandle {
  getValue(): string;
}

export interface CodeEditorProps {
  initialValue: string;
  onRun: () => void;
  onEscape: () => void;
}

const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(function CodeEditor(
  { initialValue, onRun, onEscape },
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
      extensions: [basicSetup, python(), bossFightsEditorExtensions, runKeymap],
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
