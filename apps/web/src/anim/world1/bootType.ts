import gsap from "gsap";
import { playCue, playKey, preloadKeys } from "../../lib/sound";
import { prefersReducedMotion } from "./motionContext";

export interface BootLineSegment {
  text: string;
  el: HTMLElement;
}

export interface BootLine {
  segments: BootLineSegment[];
  totalLength: number;
}

export function makeBootLine(segments: BootLineSegment[]): BootLine {
  return {
    segments,
    totalLength: segments.reduce((sum, s) => sum + s.text.length, 0),
  };
}

export interface BootSequenceOptions {
  lines: BootLine[];
  cursorEl: HTMLElement;
  containerEl: HTMLElement;
  onComplete: () => void;
  /** Fade the whole screen in when motion is reduced. Off for a later part of the same screen. */
  fade?: boolean;
}

export interface BootSequenceHandle {
  skip: () => void;
}

const MS_PER_CHAR = 22;
const LINE_GAP_S = 0.09;

/** Any keypress or click should call handle.skip() to jump straight to the end state. */
export function playBootSequence({
  lines,
  cursorEl,
  containerEl,
  onComplete,
  fade = true,
}: BootSequenceOptions): BootSequenceHandle {
  preloadKeys();
  if (prefersReducedMotion()) {
    for (const line of lines) revealLine(line, line.totalLength);
    gsap.set(cursorEl, { opacity: 0.6 });
    if (fade) {
      gsap.fromTo(
        containerEl,
        { opacity: 0 },
        { opacity: 1, duration: 0.4, ease: "power1.inOut", onComplete },
      );
    } else {
      onComplete();
    }
    return { skip: () => undefined };
  }

  let cursorBlink: gsap.core.Tween | null = null;
  const master = gsap.timeline({
    onComplete: () => {
      cursorBlink?.kill();
      gsap.set(cursorEl, { opacity: 0 });
      onComplete();
    },
  });

  lines.forEach((line, lineIndex) => {
    const counter = { i: 0 };
    let typed = 0;
    master.to(
      counter,
      {
        i: line.totalLength,
        duration: (line.totalLength * MS_PER_CHAR) / 1000,
        ease: "none",
        snap: { i: 1 },
        onStart: () => {
          placeCursorAfterLine(cursorEl, line);
          cursorBlink?.kill();
          cursorBlink = gsap.to(cursorEl, {
            opacity: 0,
            duration: 0.53,
            repeat: -1,
            yoyo: true,
            ease: "steps(1)",
          });
        },
        onUpdate: () => {
          revealLine(line, counter.i);
          if (counter.i > typed) {
            typed = counter.i;
            // About one letter in three, never a space: the pace of quick typing, not a buzz.
            if (typed % 3 === 0 && charAt(line, typed - 1).trim() !== "") playKey();
          }
        },
        onComplete: () => {
          if (lineIndex < lines.length - 1) playCue("run");
        },
      },
      lineIndex === 0 ? 0 : `+=${String(LINE_GAP_S)}`,
    );
  });

  const skip = (): void => {
    master.kill();
    cursorBlink?.kill();
    for (const line of lines) revealLine(line, line.totalLength);
    gsap.set(cursorEl, { opacity: 0 });
    onComplete();
  };

  return { skip };
}

function charAt(line: BootLine, index: number): string {
  let offset = index;
  for (const seg of line.segments) {
    if (offset < seg.text.length) return seg.text.charAt(offset);
    offset -= seg.text.length;
  }
  return "";
}

/** Exported for direct unit testing of the segment-boundary character math. */
export function revealLine(line: BootLine, revealedChars: number): void {
  let consumed = 0;
  for (const seg of line.segments) {
    const segLen = seg.text.length;
    const visible = Math.max(0, Math.min(segLen, revealedChars - consumed));
    seg.el.textContent = seg.text.slice(0, visible);
    consumed += segLen;
  }
}

function placeCursorAfterLine(cursorEl: HTMLElement, line: BootLine): void {
  const lastSegment = line.segments[line.segments.length - 1];
  lastSegment?.el.after(cursorEl);
}
