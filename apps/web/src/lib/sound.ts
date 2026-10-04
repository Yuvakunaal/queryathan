/**
 * Small synthesized sound cues (Web Audio, no files, no network). Off until
 * the player turns it on, and every call is a no-op while it is off or when
 * the browser has no audio, so callers never need to check.
 */
export type Cue = "run" | "error" | "clear" | "win";

interface Note {
  /** Frequency in Hz. */
  f: number;
  /** Start offset in seconds. */
  at: number;
  /** Length in seconds. */
  dur: number;
  type: OscillatorType;
  gain: number;
}

// A major pentatonic run for wins, a low falling pair for errors: readable by ear, never harsh.
export const CUES: Record<Cue, readonly Note[]> = {
  run: [{ f: 660, at: 0, dur: 0.05, type: "square", gain: 0.04 }],
  error: [
    { f: 196, at: 0, dur: 0.14, type: "sawtooth", gain: 0.05 },
    { f: 147, at: 0.12, dur: 0.22, type: "sawtooth", gain: 0.05 },
  ],
  clear: [
    { f: 523, at: 0, dur: 0.09, type: "triangle", gain: 0.07 },
    { f: 784, at: 0.08, dur: 0.14, type: "triangle", gain: 0.07 },
  ],
  win: [
    { f: 392, at: 0, dur: 0.12, type: "triangle", gain: 0.08 },
    { f: 523, at: 0.11, dur: 0.12, type: "triangle", gain: 0.08 },
    { f: 659, at: 0.22, dur: 0.12, type: "triangle", gain: 0.08 },
    { f: 784, at: 0.33, dur: 0.12, type: "triangle", gain: 0.08 },
    { f: 1047, at: 0.44, dur: 0.5, type: "triangle", gain: 0.09 },
  ],
};

let enabled = false;
let context: AudioContext | null = null;

export function setSoundEnabled(on: boolean): void {
  enabled = on;
}

function getContext(): AudioContext | null {
  if (typeof window === "undefined" || typeof window.AudioContext !== "function") {
    return null;
  }
  context ??= new window.AudioContext();
  return context;
}

export function playCue(cue: Cue): void {
  if (!enabled) return;
  try {
    const ctx = getContext();
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume();
    const start = ctx.currentTime + 0.01;
    for (const note of CUES[cue]) {
      const osc = ctx.createOscillator();
      const amp = ctx.createGain();
      osc.type = note.type;
      osc.frequency.value = note.f;
      const t0 = start + note.at;
      amp.gain.setValueAtTime(0.0001, t0);
      amp.gain.exponentialRampToValueAtTime(note.gain, t0 + 0.01);
      amp.gain.exponentialRampToValueAtTime(0.0001, t0 + note.dur);
      osc.connect(amp).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + note.dur + 0.02);
    }
  } catch {
    // Audio is a nicety; a blocked or missing context just stays quiet.
  }
}

export type TypingKey = "letter" | "space" | "enter" | "back";

/**
 * Which keystroke sound, if any, a key event deserves while typing in the editor.
 * Shortcuts (Ctrl/Cmd/Alt combinations), arrows, Tab, function keys and a lone
 * modifier press stay silent: only keys that put something in the text or take it out.
 */
export function typingKeyFor(event: {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
}): TypingKey | null {
  if (event.ctrlKey || event.metaKey || event.altKey) return null;
  if (event.key === "Enter") return "enter";
  if (event.key === " ") return "space";
  if (event.key === "Backspace" || event.key === "Delete") return "back";
  return event.key.length === 1 ? "letter" : null;
}

const KEY_SAMPLES = 8;
let keyBuffers: AudioBuffer[] | null = null;
let keyLoading: Promise<void> | null = null;
let lastKey = -1;
let lastKeyAt = 0;

/**
 * Starts fetching the keystroke recordings (public/sounds, a CC0 pack recorded
 * on a real keyboard). Safe to call often and before sound is enabled; it only
 * fetches once, and playKey stays silent until they have arrived.
 */
export function preloadKeys(): void {
  if (keyLoading || keyBuffers) return;
  if (typeof window === "undefined" || typeof window.OfflineAudioContext !== "function") {
    return;
  }
  // Decoding on an offline context needs no user gesture and its buffers play on any context.
  const ctx = new window.OfflineAudioContext(1, 1, 44100);
  keyLoading = (async () => {
    try {
      const buffers = await Promise.all(
        Array.from({ length: KEY_SAMPLES }, async (_, i) => {
          const response = await fetch(`/sounds/key-${String(i + 1)}.wav`);
          if (!response.ok) throw new Error("missing keystroke sample");
          return ctx.decodeAudioData(await response.arrayBuffer());
        }),
      );
      keyBuffers = buffers;
    } catch {
      keyLoading = null; // try again next time; typing is simply silent meanwhile
    }
  })();
}

/**
 * One keystroke from the recorded set. A different recording from the last one
 * each time, with the pitch nudged a little and a slightly different loudness,
 * so a run of them sounds like a person typing, not a loop.
 */
export function playKey(kind: TypingKey = "letter"): void {
  if (!enabled || !keyBuffers) return;
  // A held key repeats far faster than anyone types; keep it a patter, not a buzz.
  const now = performance.now();
  if (now - lastKeyAt < 35) return;
  lastKeyAt = now;
  try {
    const ctx = getContext();
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume();
    let index = Math.floor(Math.random() * keyBuffers.length);
    if (index === lastKey) index = (index + 1) % keyBuffers.length;
    lastKey = index;
    const source = ctx.createBufferSource();
    source.buffer = keyBuffers[index] ?? null;
    // Big keys sound deeper and a touch fuller, like a real keyboard's space bar and enter.
    const deeper = kind === "space" || kind === "enter";
    source.playbackRate.value = (deeper ? 0.82 : 0.96) + Math.random() * 0.08;
    const amp = ctx.createGain();
    amp.gain.value = (deeper ? 0.36 : 0.28) + Math.random() * 0.1;
    source.connect(amp).connect(ctx.destination);
    source.start();
  } catch {
    // Audio is a nicety; a blocked or missing context just stays quiet.
  }
}
