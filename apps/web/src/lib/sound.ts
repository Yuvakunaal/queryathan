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

let effectsOn = false;
let typingOn = false;
let volume = 0.8;
let context: AudioContext | null = null;
let master: GainNode | null = null;

/** What the player chose in the sound menu. Volume is 0 to 1 and applies to everything. */
export interface SoundPrefs {
  effects: boolean;
  typing: boolean;
  volume: number;
}

export function configureSound(prefs: SoundPrefs): void {
  effectsOn = prefs.effects;
  typingOn = prefs.typing;
  volume = Math.min(1, Math.max(0, prefs.volume));
  if (master) master.gain.value = volume * volume;
}

/** Turns the effect tones (not typing) on or off. */
export function setSoundEnabled(on: boolean): void {
  effectsOn = on;
}

function getContext(): AudioContext | null {
  if (typeof window === "undefined" || typeof window.AudioContext !== "function") {
    return null;
  }
  context ??= new window.AudioContext();
  return context;
}

/** Everything plays through one gain node, so the volume control reaches every sound. */
function getOutput(ctx: AudioContext): AudioNode {
  if (!master) {
    master = ctx.createGain();
    // Perceived loudness is roughly the square of the slider, so the middle sounds like the middle.
    master.gain.value = volume * volume;
    master.connect(ctx.destination);
  }
  return master;
}

export function playCue(cue: Cue): void {
  if (!effectsOn) return;
  try {
    const ctx = getContext();
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume();
    const out = getOutput(ctx);
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
      osc.connect(amp).connect(out);
      osc.start(t0);
      osc.stop(t0 + note.dur + 0.02);
    }
  } catch {
    // Audio is a nicety; a blocked or missing context just stays quiet.
  }
}

/** Decoded recordings from public/sounds, by file name. */
const samples = new Map<string, AudioBuffer>();
const sampleLoads = new Map<string, Promise<void>>();

/**
 * Starts fetching recordings (public/sounds) so they are ready when needed.
 * Safe to call often; each file is fetched once. Playing stays silent until
 * a file has arrived.
 */
export function preloadSamples(names: readonly string[]): void {
  if (typeof window === "undefined" || typeof window.OfflineAudioContext !== "function") {
    return;
  }
  // Decoding on an offline context needs no user gesture and its buffers play on any context.
  const decoder = new window.OfflineAudioContext(1, 1, 44100);
  for (const name of names) {
    if (samples.has(name) || sampleLoads.has(name)) continue;
    sampleLoads.set(
      name,
      (async () => {
        try {
          const response = await fetch(`/sounds/${name}.wav`);
          if (!response.ok) throw new Error(`missing sound ${name}`);
          samples.set(name, await decoder.decodeAudioData(await response.arrayBuffer()));
        } catch {
          sampleLoads.delete(name); // try again next time; it is simply silent meanwhile
        }
      })(),
    );
  }
}

/** How long before its loudest moment the knife recording starts, so the hit can be timed to the cut. */
export const SLICE_LEAD_SECONDS = 0.2;

export function preloadSlice(): void {
  preloadSamples(["slice-1"]);
}

/**
 * The knife cut: a real knife recording (whoosh into the strike) with a low
 * thump under the moment of impact for weight. Starts immediately; the loudest
 * part lands SLICE_LEAD_SECONDS later.
 */
export function playSlice(): void {
  if (!effectsOn) return;
  const buffer = samples.get("slice-1");
  if (!buffer) return;
  try {
    const ctx = getContext();
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume();
    const out = getOutput(ctx);
    const t0 = ctx.currentTime + 0.005;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const amp = ctx.createGain();
    amp.gain.value = 0.9;
    source.connect(amp).connect(out);
    source.start(t0);

    const hit = t0 + SLICE_LEAD_SECONDS;
    const thump = ctx.createOscillator();
    thump.type = "sine";
    thump.frequency.setValueAtTime(130, hit);
    thump.frequency.exponentialRampToValueAtTime(48, hit + 0.18);
    const thumpAmp = ctx.createGain();
    thumpAmp.gain.setValueAtTime(0.0001, hit);
    thumpAmp.gain.exponentialRampToValueAtTime(0.35, hit + 0.012);
    thumpAmp.gain.exponentialRampToValueAtTime(0.0001, hit + 0.26);
    thump.connect(thumpAmp).connect(out);
    thump.start(hit);
    thump.stop(hit + 0.3);
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
const KEY_NAMES = Array.from({ length: KEY_SAMPLES }, (_, i) => `key-${String(i + 1)}`);
let lastKey = -1;
let lastKeyAt = 0;

/** Starts fetching the keystroke recordings (a CC0 pack recorded on a real keyboard). */
export function preloadKeys(): void {
  preloadSamples(KEY_NAMES);
}

/**
 * One keystroke from the recorded set. A different recording from the last one
 * each time, with the pitch nudged a little and a slightly different loudness,
 * so a run of them sounds like a person typing, not a loop.
 */
export function playKey(kind: TypingKey = "letter"): void {
  if (!typingOn) return;
  const keyBuffers = KEY_NAMES.map((name) => samples.get(name)).filter(
    (buffer): buffer is AudioBuffer => buffer !== undefined,
  );
  if (keyBuffers.length === 0) return;
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
    source.connect(amp).connect(getOutput(ctx));
    source.start();
  } catch {
    // Audio is a nicety; a blocked or missing context just stays quiet.
  }
}
