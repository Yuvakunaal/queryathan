import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import { prefersReducedMotion } from "../../anim/world1/motionContext";
import styles from "./RunBar.module.css";

export interface RunBarProps {
  isRunning: boolean;
  onRun: () => void;
  buttonRef?: RefObject<HTMLButtonElement | null>;
}

const SPINNER_FRAMES = ["|", "/", "-", "\\"];
const FIRST_FRAME = SPINNER_FRAMES[0] ?? "|";

export default function RunBar({ isRunning, onRun, buttonRef }: RunBarProps) {
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = labelRef.current;
    if (!isRunning || !el) return;

    if (prefersReducedMotion()) {
      el.textContent = "[*] RUNNING";
      return;
    }

    let frame = 0;
    el.textContent = `[${FIRST_FRAME}] RUNNING`;
    const interval = setInterval(() => {
      frame = (frame + 1) % SPINNER_FRAMES.length;
      el.textContent = `[${SPINNER_FRAMES[frame] ?? FIRST_FRAME}] RUNNING`;
    }, 100);
    return () => {
      clearInterval(interval);
    };
  }, [isRunning]);

  return (
    <div className={styles.runBar}>
      <button
        type="button"
        ref={buttonRef}
        className={styles.runButton}
        data-running={isRunning ? "true" : undefined}
        onClick={onRun}
        disabled={isRunning}
      >
        {isRunning ? (
          <span ref={labelRef}>{`[${FIRST_FRAME}] RUNNING`}</span>
        ) : (
          ">_ EXECUTE"
        )}
      </button>
      <span className={styles.hint}>CTRL+ENTER</span>
    </div>
  );
}
