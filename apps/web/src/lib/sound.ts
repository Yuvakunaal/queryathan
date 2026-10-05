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

// Short tones for running code, clearing afflictions and errors: readable by ear, never harsh. The win ending is built separately below.
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
    // A limiter at the end: the knife and the ending stack several layers, and this keeps
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
    playVictoryEnding();
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

/** A soft, short room: decaying noise, used only to give the ending some air. */
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

/**
 * The ending after the cut: smooth and settled, the sound of a problem solved.
 * A warm D major chord swells in like strings and holds, soft felt-piano notes
 * climb through the scale and land on a ringing top note, a gentle low note gives
 * the moment some weight, and a long, quiet room carries it all away. No
 * distortion, nothing sharp. About 3 seconds.
 */
function playVictoryEnding(): void {
  try {
    const ctx = getContext();
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume();
    const out = getOutput(ctx);
    const t0 = ctx.currentTime + 0.02;

    const dry = ctx.createGain();
    dry.gain.value = 0.8;
    dry.connect(out);
    const reverb = ctx.createConvolver();
    reverb.buffer = getReverb(ctx);
    const wet = ctx.createGain();
    wet.gain.value = 0.46;
    reverb.connect(wet).connect(out);
    const bus = ctx.createGain();
    bus.connect(dry);
    bus.connect(reverb);

    // Felt piano: a sine with a quiet octave above, a soft strike and a long, even decay.
    const note = (freq: number, at: number, hold: number, level: number): void => {
      const partials: [number, number, number][] = [
        [1, 1, hold],
        [2, 0.22, hold * 0.6],
        [3, 0.07, hold * 0.3],
      ];
      for (const [ratio, gain, length] of partials) {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = freq * ratio;
        const amp = ctx.createGain();
        amp.gain.setValueAtTime(0.0001, t0 + at);
        amp.gain.exponentialRampToValueAtTime(level * gain, t0 + at + 0.014);
        amp.gain.exponentialRampToValueAtTime(0.0001, t0 + at + length);
        osc.connect(amp).connect(bus);
        osc.start(t0 + at);
        osc.stop(t0 + at + length + 0.05);
      }
    };
    // D major pentatonic, climbing and landing: D5 F#5 A5 D6, then the high D rings.
    note(587.33, 0.0, 1.6, 0.16);
    note(739.99, 0.16, 1.6, 0.15);
    note(880.0, 0.32, 1.7, 0.15);
    note(1174.66, 0.52, 2.6, 0.17);

    // The pad: D2 root underneath, then D3, A3, F#4, E5 (a D major add9 chord) swelling in slowly.
    const pad = ctx.createBiquadFilter();
    pad.type = "lowpass";
    pad.frequency.setValueAtTime(700, t0 + 0.1);
    pad.frequency.exponentialRampToValueAtTime(2300, t0 + 1.5);
    pad.connect(bus);
    for (const freq of [146.83, 220, 369.99, 659.25]) {
      for (const detune of [-6, 6]) {
        const osc = ctx.createOscillator();
        osc.type = "triangle";
        osc.frequency.value = freq;
        osc.detune.value = detune;
        const amp = ctx.createGain();
        amp.gain.setValueAtTime(0.0001, t0 + 0.1);
        amp.gain.exponentialRampToValueAtTime(0.034, t0 + 0.8);
        amp.gain.exponentialRampToValueAtTime(0.02, t0 + 1.8);
        amp.gain.exponentialRampToValueAtTime(0.0001, t0 + 3.1);
        osc.connect(amp).connect(pad);
        osc.start(t0 + 0.1);
        osc.stop(t0 + 3.2);
      }
    }
    // A soft low note for weight: D2, rounded off, fading under everything.
    glide(ctx, bus, { at: t0, dur: 1.6, from: 73.42, to: 71.5, peak: 0.26 });
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

/**
 * The landing, scored like a film rather than a notification: the landing legs
 * touch down with two dull metallic knocks and a deep thump, the engine winds
 * down to nothing, dust and thin air hiss away, and a low open chord (a bare
 * fifth with a rising ninth) swells out of the silence on a long, dark reverb,
 * with a sub-bass swell under it that slowly settles. No bright tones.
 */
function playLanding(ctx: AudioContext, out: AudioNode, t: number): void {
  const reverb = ctx.createConvolver();
  reverb.buffer = getReverb(ctx);
  const wet = ctx.createGain();
  wet.gain.value = 0.6;
  reverb.connect(wet).connect(out);
  const bus = ctx.createGain();
  bus.connect(out);
  bus.connect(reverb);

  // Contact: legs on rock, a heavy thump, a second settling knock.
  glide(ctx, bus, { at: t, dur: 0.5, from: 130, to: 42, peak: 0.5 });
  noiseBurst(ctx, bus, {
    at: t,
    dur: 0.14,
    type: "bandpass",
    from: 1100,
    to: 260,
    q: 5,
    peak: 0.16,
    attack: 0.002,
  });
  noiseBurst(ctx, bus, {
    at: t + 0.09,
    dur: 0.12,
    type: "bandpass",
    from: 800,
    to: 220,
    q: 5,
    peak: 0.1,
    attack: 0.002,
  });
  // The engine winding down, and dust hissing away.
  noiseBurst(ctx, bus, {
    at: t - 0.05,
    dur: 0.7,
    type: "lowpass",
    from: 900,
    to: 70,
    q: 0.7,
    peak: 0.16,
    attack: 0.03,
  });
  noiseBurst(ctx, bus, {
    at: t + 0.06,
    dur: 1.2,
    type: "bandpass",
    from: 2400,
    to: 600,
    q: 0.6,
    peak: 0.07,
    attack: 0.1,
  });

  // The quiet that follows: a dark chord rising out of it, D2 A2 D3 E3 A3 (open fifths and a ninth).
  const pad = ctx.createBiquadFilter();
  pad.type = "lowpass";
  pad.frequency.setValueAtTime(260, t + 0.1);
  pad.frequency.exponentialRampToValueAtTime(1400, t + 1.3);
  pad.frequency.exponentialRampToValueAtTime(380, t + 2.8);
  pad.connect(bus);
  const voices: [number, number][] = [
    [73.42, 0.05],
    [110, 0.045],
    [146.83, 0.04],
    [164.81, 0.022],
    [220, 0.03],
  ];
  for (const [freq, level] of voices) {
    for (const detune of [-5, 5]) {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = freq;
      osc.detune.value = detune;
      const amp = ctx.createGain();
      amp.gain.setValueAtTime(0.0001, t + 0.1);
      amp.gain.exponentialRampToValueAtTime(level * 0.5, t + 1.1);
      amp.gain.exponentialRampToValueAtTime(level * 0.35, t + 1.9);
      amp.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
      osc.connect(amp).connect(pad);
      osc.start(t + 0.1);
      osc.stop(t + 3.3);
    }
  }
  // Sub swell: felt more than heard, settling like a held breath.
  glide(ctx, bus, { at: t + 0.15, dur: 3.0, from: 36.7, to: 34.6, peak: 0.22 });
  // A touch of thin air over everything, rising and falling once.
  noiseBurst(ctx, bus, {
    at: t + 0.5,
    dur: 2.6,
    type: "bandpass",
    from: 500,
    to: 1500,
    q: 0.9,
    peak: 0.035,
    attack: 1.2,
  });
}

/**
 * The flight to another world, about 5.5 seconds and deliberately smooth: a soft
 * ignition thump and a rumble that swells, a warp sweep that climbs, a braking
 * hiss, the thicker rumble of the descent, then the landing (see playLanding).
 * Follows the effects switch and the volume. Returns a function that fades it
 * out, for when the flight is skipped.
 */
export function playTravel(): () => void {
  if (!effectsOn) return () => undefined;
  try {
    const ctx = getContext();
    if (!ctx) return () => undefined;
    if (ctx.state === "suspended") void ctx.resume();
    // Its own gain stage, so skipping the flight can fade the whole thing out.
    const out = ctx.createGain();
    out.connect(getOutput(ctx));
    const t0 = ctx.currentTime + 0.02;

    glide(ctx, out, { at: t0 + 0.12, dur: 0.55, from: 96, to: 40, peak: 0.45 });
    noiseBurst(ctx, out, {
      at: t0 + 0.1,
      dur: 1.9,
      type: "lowpass",
      from: 150,
      to: 460,
      q: 0.7,
      peak: 0.26,
      attack: 0.6,
    });
    noiseBurst(ctx, out, {
      at: t0 + 0.9,
      dur: 1.5,
      type: "bandpass",
      from: 350,
      to: 3800,
      q: 1.2,
      peak: 0.17,
      attack: 0.95,
    });
    glide(ctx, out, {
      at: t0 + 0.9,
      dur: 1.5,
      from: 110,
      to: 660,
      peak: 0.1,
      type: "triangle",
    });
    noiseBurst(ctx, out, {
      at: t0 + 2.3,
      dur: 0.8,
      type: "bandpass",
      from: 3000,
      to: 500,
      q: 0.9,
      peak: 0.08,
      attack: 0.25,
    });
    // the descent: air thickening, the engine burning against it
    noiseBurst(ctx, out, {
      at: t0 + 3.3,
      dur: 1.5,
      type: "lowpass",
      from: 260,
      to: 900,
      q: 0.8,
      peak: 0.24,
      attack: 0.7,
    });
    noiseBurst(ctx, out, {
      at: t0 + 3.4,
      dur: 1.2,
      type: "bandpass",
      from: 1200,
      to: 2600,
      q: 0.7,
      peak: 0.07,
      attack: 0.6,
    });
    // touchdown, then the planet's own quiet
    playLanding(ctx, out, t0 + 4.6);
    return () => {
      try {
        out.gain.cancelScheduledValues(ctx.currentTime);
        out.gain.setValueAtTime(out.gain.value, ctx.currentTime);
        out.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.25);
      } catch {
        // Nothing to stop.
      }
    };
  } catch {
    // Audio is a nicety; a blocked or missing context just stays quiet.
  }
  return () => undefined;
}
