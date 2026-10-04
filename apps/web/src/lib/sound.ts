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

// A pentatonic set, so any random order of blips still sounds pleasant.
const BLIP_NOTES = [523.25, 587.33, 659.25, 783.99, 880.0, 987.77] as const;

/**
 * One text "blip", the little bleep a game plays as dialogue types itself out:
 * a short, soft triangle tone on a random note of a pentatonic scale, rounded
 * off by a low-pass filter so it is gentle rather than shrill.
 */
export function playBlip(): void {
  if (!enabled) return;
  try {
    const ctx = getContext();
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume();
    const t0 = ctx.currentTime + 0.005;
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value =
      (BLIP_NOTES[Math.floor(Math.random() * BLIP_NOTES.length)] ?? 659.25) *
      (1 + (Math.random() - 0.5) * 0.02);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 2600;
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0.0001, t0);
    amp.gain.exponentialRampToValueAtTime(0.06, t0 + 0.006);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.055);
    osc.connect(filter).connect(amp).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + 0.07);
  } catch {
    // Audio is a nicety; a blocked or missing context just stays quiet.
  }
}
