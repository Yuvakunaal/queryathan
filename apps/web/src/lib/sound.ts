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

let noise: AudioBuffer | null = null;

/**
 * One soft keystroke, for the boot sequence's typing: a few milliseconds of
 * filtered noise at a slightly different pitch each time, so a run of them
 * sounds like typing and not like a machine gun.
 */
export function playKey(): void {
  if (!enabled) return;
  try {
    const ctx = getContext();
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume();
    noise ??= (() => {
      const length = Math.floor(ctx.sampleRate * 0.03);
      const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i += 1)
        data[i] = (Math.random() * 2 - 1) * (1 - i / length);
      return buffer;
    })();
    const source = ctx.createBufferSource();
    source.buffer = noise;
    source.playbackRate.value = 0.85 + Math.random() * 0.4;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 2200 + Math.random() * 1400;
    filter.Q.value = 0.9;
    const amp = ctx.createGain();
    amp.gain.value = 0.16;
    source.connect(filter).connect(amp).connect(ctx.destination);
    source.start();
  } catch {
    // Audio is a nicety; a blocked or missing context just stays quiet.
  }
}
