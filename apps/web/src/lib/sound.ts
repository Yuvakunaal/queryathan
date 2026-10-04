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

// Short tones for running code, clearing afflictions and errors: readable by ear, never harsh. The win stinger is built separately below.
export const CUES: Record<Exclude<Cue, "win">, readonly Note[]> = {
  run: [{ f: 660, at: 0, dur: 0.05, type: "square", gain: 0.04 }],
  error: [
    { f: 196, at: 0, dur: 0.14, type: "sawtooth", gain: 0.05 },
    { f: 147, at: 0.12, dur: 0.22, type: "sawtooth", gain: 0.05 },
  ],
  clear: [
    { f: 523, at: 0, dur: 0.09, type: "triangle", gain: 0.07 },
    { f: 784, at: 0.08, dur: 0.14, type: "triangle", gain: 0.07 },
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
    // A limiter at the end: the knife and the stinger stack several layers, and this keeps
    // their sum from ever clipping, however loud the volume is set.
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -9;
    limiter.knee.value = 6;
    limiter.ratio.value = 14;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.14;
    master.connect(limiter).connect(ctx.destination);
  }
  return master;
}

export function playCue(cue: Cue): void {
  if (!effectsOn) return;
  if (cue === "win") {
    playVictoryStinger();
    return;
  }
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

let noiseBuffer: AudioBuffer | null = null;

/** Half a second of white noise, made once and reused for every swish and splash. */
function getNoise(ctx: AudioContext): AudioBuffer {
  if (noiseBuffer?.sampleRate !== ctx.sampleRate) {
    const length = Math.floor(ctx.sampleRate * 0.5);
    noiseBuffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

/** A short burst of filtered noise: the building block of a swish, a crack or a splash. */
function noiseBurst(
  ctx: AudioContext,
  out: AudioNode,
  opts: {
    at: number;
    dur: number;
    type: BiquadFilterType;
    from: number;
    to?: number;
    q?: number;
    peak: number;
    attack?: number;
  },
): void {
  const source = ctx.createBufferSource();
  source.buffer = getNoise(ctx);
  source.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = opts.type;
  filter.Q.value = opts.q ?? 1;
  filter.frequency.setValueAtTime(opts.from, opts.at);
  if (opts.to !== undefined) {
    filter.frequency.exponentialRampToValueAtTime(opts.to, opts.at + opts.dur);
  }
  const amp = ctx.createGain();
  const attack = opts.attack ?? 0.004;
  amp.gain.setValueAtTime(0.0001, opts.at);
  amp.gain.exponentialRampToValueAtTime(opts.peak, opts.at + attack);
  amp.gain.exponentialRampToValueAtTime(0.0001, opts.at + opts.dur);
  source.connect(filter).connect(amp).connect(out);
  source.start(opts.at, Math.random() * 0.3);
  source.stop(opts.at + opts.dur + 0.05);
}

/** A tone that glides from one pitch to another and fades: a drop, a thud, a pluck. */
function glide(
  ctx: AudioContext,
  out: AudioNode,
  opts: {
    at: number;
    dur: number;
    from: number;
    to: number;
    peak: number;
    type?: OscillatorType;
  },
): void {
  const osc = ctx.createOscillator();
  osc.type = opts.type ?? "sine";
  osc.frequency.setValueAtTime(opts.from, opts.at);
  osc.frequency.exponentialRampToValueAtTime(opts.to, opts.at + opts.dur);
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(0.0001, opts.at);
  amp.gain.exponentialRampToValueAtTime(opts.peak, opts.at + 0.008);
  amp.gain.exponentialRampToValueAtTime(0.0001, opts.at + opts.dur);
  osc.connect(amp).connect(out);
  osc.start(opts.at);
  osc.stop(opts.at + opts.dur + 0.03);
}

/**
 * The knife cut, in the spirit of a fruit-slicing game: a rising air swish as
 * the blade speeds up, then at the moment of the cut a bright crack, a juicy
 * burst, a low thud and two small drops, layered under a real knife recording.
 * Starts immediately; the cut lands SLICE_LEAD_SECONDS later.
 */
export function playSlice(): void {
  if (!effectsOn) return;
  try {
    const ctx = getContext();
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume();
    const out = getOutput(ctx);
    const t0 = ctx.currentTime + 0.005;
    const hit = t0 + SLICE_LEAD_SECONDS;

    // The blade through the air: a band of noise that sweeps upward and swells into the cut.
    noiseBurst(ctx, out, {
      at: hit - 0.17,
      dur: 0.19,
      type: "bandpass",
      from: 700,
      to: 5200,
      q: 0.9,
      peak: 0.34,
      attack: 0.12,
    });

    // The recorded knife, a little under so the new layers shine through.
    const buffer = samples.get("slice-1");
    if (buffer) {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const amp = ctx.createGain();
      amp.gain.value = 0.7;
      source.connect(amp).connect(out);
      source.start(t0);
    }

    // The cut itself.
    noiseBurst(ctx, out, {
      at: hit,
      dur: 0.05,
      type: "highpass",
      from: 3800,
      peak: 0.42,
      attack: 0.002,
    }); // crack
    noiseBurst(ctx, out, {
      at: hit,
      dur: 0.2,
      type: "bandpass",
      from: 2100,
      to: 900,
      q: 1.1,
      peak: 0.45,
      attack: 0.006,
    }); // juice
    noiseBurst(ctx, out, {
      at: hit + 0.02,
      dur: 0.14,
      type: "lowpass",
      from: 700,
      to: 260,
      peak: 0.3,
      attack: 0.01,
    }); // body
    glide(ctx, out, { at: hit, dur: 0.22, from: 150, to: 52, peak: 0.42 }); // thud
    // Two small drops as the halves part.
    glide(ctx, out, { at: hit + 0.085, dur: 0.07, from: 880, to: 360, peak: 0.1 });
    glide(ctx, out, { at: hit + 0.135, dur: 0.07, from: 640, to: 280, peak: 0.08 });
  } catch {
    // Audio is a nicety; a blocked or missing context just stays quiet.
  }
}

let reverbImpulse: AudioBuffer | null = null;

/** A soft, short room: decaying noise, used only to give the kill stinger some air. */
function getReverb(ctx: AudioContext): AudioBuffer {
  if (reverbImpulse?.sampleRate !== ctx.sampleRate) {
    const length = Math.floor(ctx.sampleRate * 1.7);
    reverbImpulse = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let channel = 0; channel < 2; channel += 1) {
      const data = reverbImpulse.getChannelData(channel);
      for (let i = 0; i < length; i += 1) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3.2);
      }
    }
  }
  return reverbImpulse;
}

/** A hard-clipping curve: turns a plain saw into a snarling, amp-like power chord. */
function distortionCurve(amount: number): Float32Array<ArrayBuffer> {
  const curve = new Float32Array(new ArrayBuffer(2048 * 4));
  for (let i = 0; i < curve.length; i += 1) {
    const x = (i / (curve.length - 1)) * 2 - 1;
    curve[i] = ((1 + amount) * x) / (1 + amount * Math.abs(x));
  }
  return curve;
}

/**
 * The kill stinger: what plays as "Boss cleared" slams onto the screen. Two heavy
 * hits in D minor, like a boss falling in a dark action game: a short punch, then
 * a big distorted power chord with a sub boom, a cymbal-like crash and a long
 * decaying room. Built from saws through a distortion stage, so it sounds
 * aggressive and final, not cheerful. About 2.4 seconds.
 */
function playVictoryStinger(): void {
  try {
    const ctx = getContext();
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume();
    const out = getOutput(ctx);
    const t0 = ctx.currentTime + 0.02;

    const dry = ctx.createGain();
    dry.gain.value = 0.85;
    dry.connect(out);
    const reverb = ctx.createConvolver();
    reverb.buffer = getReverb(ctx);
    const wet = ctx.createGain();
    wet.gain.value = 0.34;
    reverb.connect(wet).connect(out);
    const bus = ctx.createGain();
    bus.connect(dry);
    bus.connect(reverb);

    const drive = ctx.createWaveShaper();
    drive.curve = distortionCurve(38);
    drive.oversample = "2x";
    const tone = ctx.createBiquadFilter();
    tone.type = "lowpass";
    tone.frequency.value = 2400;
    drive.connect(tone).connect(bus);

    // A distorted power chord: saws (a little detuned) through the drive.
    const chord = (freqs: number[], at: number, hold: number, level: number): void => {
      for (const freq of freqs) {
        for (const detune of [-9, 9]) {
          const osc = ctx.createOscillator();
          osc.type = "sawtooth";
          osc.frequency.value = freq;
          osc.detune.value = detune;
          const amp = ctx.createGain();
          amp.gain.setValueAtTime(0.0001, t0 + at);
          amp.gain.exponentialRampToValueAtTime(level, t0 + at + 0.006);
          amp.gain.exponentialRampToValueAtTime(level * 0.45, t0 + at + hold * 0.3);
          amp.gain.exponentialRampToValueAtTime(0.0001, t0 + at + hold);
          osc.connect(amp).connect(drive);
          osc.start(t0 + at);
          osc.stop(t0 + at + hold + 0.05);
        }
      }
    };

    // Hit one: a short, tight punch (D3, A3, D4).
    chord([146.83, 220, 293.66], 0, 0.3, 0.07);
    noiseBurst(ctx, bus, {
      at: t0,
      dur: 0.09,
      type: "bandpass",
      from: 1800,
      q: 0.7,
      peak: 0.3,
      attack: 0.002,
    });
    glide(ctx, bus, { at: t0, dur: 0.2, from: 140, to: 55, peak: 0.45 });

    // Hit two: the big one (D2, A2, D3, F3, A3), with the boom, the crash and the ring.
    const big = 0.34;
    chord([73.42, 110, 146.83, 174.61, 220], big, 1.9, 0.075);
    glide(ctx, bus, { at: t0 + big, dur: 1.1, from: 95, to: 32, peak: 0.6 });
    noiseBurst(ctx, bus, {
      at: t0 + big,
      dur: 0.12,
      type: "bandpass",
      from: 2400,
      q: 0.6,
      peak: 0.34,
      attack: 0.002,
    });
    noiseBurst(ctx, bus, {
      at: t0 + big,
      dur: 1.6,
      type: "highpass",
      from: 6200,
      to: 4200,
      peak: 0.2,
      attack: 0.01,
    });
    noiseBurst(ctx, bus, {
      at: t0 + big,
      dur: 0.9,
      type: "lowpass",
      from: 420,
      to: 120,
      peak: 0.34,
      attack: 0.02,
    });
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
