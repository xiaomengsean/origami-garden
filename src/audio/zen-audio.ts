import { useSettingsStore } from '../store/settings-store.ts';

let audioCtx: AudioContext | null = null;

function getContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

export function resumeAudio(): void {
  const ctx = getContext();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
}

function getSfxVolume(): number {
  return useSettingsStore.getState().sfxVolume;
}

function getMusicVolume(): number {
  return useSettingsStore.getState().musicVolume;
}

export function playFoldSound(): void {
  const ctx = getContext();
  const vol = getSfxVolume();
  if (vol === 0) return;

  const now = ctx.currentTime;
  const gain = ctx.createGain();
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.15 * vol, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

  const noise = ctx.createBufferSource();
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.1));
  }
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2000, now);
  filter.frequency.exponentialRampToValueAtTime(400, now + 0.3);

  noise.connect(filter);
  filter.connect(gain);
  noise.start(now);
  noise.stop(now + 0.4);
}

export function playMatchSound(): void {
  const ctx = getContext();
  const vol = getSfxVolume();
  if (vol === 0) return;

  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + i * 0.12);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.08 * vol, now + i * 0.12 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.8);

    osc.start(now + i * 0.12);
    osc.stop(now + i * 0.12 + 0.8);
  });
}

export function playCompleteSound(): void {
  const ctx = getContext();
  const vol = getSfxVolume();
  if (vol === 0) return;

  const now = ctx.currentTime;
  const notes = [392, 440, 523.25, 659.25, 783.99]; // G4, A4, C5, E5, G5

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + i * 0.15);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.1 * vol, now + i * 0.15 + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 1.2);

    osc.start(now + i * 0.15);
    osc.stop(now + i * 0.15 + 1.2);
  });

  const shimmer = ctx.createOscillator();
  const shimmerGain = ctx.createGain();
  shimmer.connect(shimmerGain);
  shimmerGain.connect(ctx.destination);
  shimmer.type = 'sine';
  shimmer.frequency.setValueAtTime(1567.98, now + 0.6);
  shimmerGain.gain.setValueAtTime(0, now);
  shimmerGain.gain.linearRampToValueAtTime(0.04 * vol, now + 0.7);
  shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 2);
  shimmer.start(now + 0.6);
  shimmer.stop(now + 2);
}

export function playUndoSound(): void {
  const ctx = getContext();
  const vol = getSfxVolume();
  if (vol === 0) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'sine';
  osc.frequency.setValueAtTime(400, now);
  osc.frequency.exponentialRampToValueAtTime(300, now + 0.15);

  gain.gain.setValueAtTime(0.08 * vol, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

  osc.start(now);
  osc.stop(now + 0.2);
}

export function playButtonSound(): void {
  const ctx = getContext();
  const vol = getSfxVolume();
  if (vol === 0) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, now);

  gain.gain.setValueAtTime(0.06 * vol, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

  osc.start(now);
  osc.stop(now + 0.1);
}

let isAmbientPlaying = false;
let musicTimers: ReturnType<typeof setTimeout>[] = [];
let droneNodes: { osc: OscillatorNode; gain: GainNode }[] = [];
let reverbNode: ConvolverNode | null = null;
let reverbGain: GainNode | null = null;
let dryGain: GainNode | null = null;
let masterGain: GainNode | null = null;

const TEMPO_BPM = 72;
const BEAT_SEC = 60 / TEMPO_BPM;

const P = {
  C3: 130.81, E3: 164.81, G3: 196.00, A3: 220.00,
  C4: 261.63, D4: 293.66, E4: 329.63, G4: 392.00, A4: 440.00,
  C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.00,
};

// Pentatonic phrases: each phrase flows naturally into the next
const PHRASES: number[][] = [
  [P.E4, P.G4, P.A4, P.C5, P.E5, P.D5, P.C5, P.A4, P.G4, P.E4, P.G4, P.A4],
  [P.C5, P.D5, P.E5, P.G5, P.E5, P.D5, P.C5, P.A4, P.C5, P.D5, P.E5, P.C5],
  [P.A4, P.C5, P.D5, P.E5, P.D5, P.C5, P.A4, P.G4, P.A4, P.C5, P.D5, P.E5],
  [P.G4, P.A4, P.C5, P.E5, P.D5, P.C5, P.D5, P.E5, P.G5, P.E5, P.D5, P.C5],
  [P.D5, P.C5, P.A4, P.G4, P.A4, P.C5, P.E5, P.G5, P.E5, P.D5, P.C5, P.D5],
  [P.E5, P.D5, P.C5, P.A4, P.C5, P.D5, P.E5, P.G4, P.A4, P.C5, P.E5, P.G5],
];

const CHORD_ROOTS = [P.C3, P.A3, P.G3, P.C3, P.E3, P.A3];

function buildReverbIR(): AudioBuffer {
  const ctx = getContext();
  const sr = ctx.sampleRate;
  const len = sr * 2.5;
  const buf = ctx.createBuffer(2, len, sr);

  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sr * 0.8));
    }
  }
  return buf;
}

function getMusicBus(): GainNode {
  const ctx = getContext();

  if (!masterGain) {
    masterGain = ctx.createGain();
    masterGain.gain.value = 1;

    reverbNode = ctx.createConvolver();
    reverbNode.buffer = buildReverbIR();

    reverbGain = ctx.createGain();
    reverbGain.gain.value = 0.35;

    dryGain = ctx.createGain();
    dryGain.gain.value = 0.65;

    masterGain.connect(dryGain);
    dryGain.connect(ctx.destination);

    masterGain.connect(reverbNode);
    reverbNode.connect(reverbGain);
    reverbGain.connect(ctx.destination);
  }

  return masterGain;
}

function startDrone(vol: number): void {
  const ctx = getContext();
  const bus = getMusicBus();
  const now = ctx.currentTime;

  // Layered pad: multiple detuned sines for a warm continuous bed
  const freqs = [P.C3, P.G3, P.C4, P.E4];
  const detunes = [-4, 3, -2, 5];

  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.detune.value = detunes[i];

    osc.connect(gain);
    gain.connect(bus);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.025 * vol, now + 3);

    osc.start(now);
    droneNodes.push({ osc, gain });
  });
}

function updateDroneVolume(vol: number): void {
  const ctx = getContext();
  const now = ctx.currentTime;
  droneNodes.forEach(({ gain }) => {
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(0.025 * vol, now + 0.5);
  });
}

function playMelodyNote(freq: number, startTime: number, duration: number, vol: number): void {
  const ctx = getContext();
  const bus = getMusicBus();

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, startTime);

  osc.connect(gain);
  gain.connect(bus);

  // Soft attack, long sustain, gentle release — notes overlap
  const attack = 0.12;
  const release = duration * 0.4;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(0.045 * vol, startTime + attack);
  gain.gain.setValueAtTime(0.045 * vol, startTime + duration - release);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
}

function playPadChord(root: number, startTime: number, duration: number, vol: number): void {
  const ctx = getContext();
  const bus = getMusicBus();

  // Play root + fifth + octave as a gentle sustained chord
  const intervals = [1, 1.5, 2];
  intervals.forEach((ratio, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = root * ratio;
    osc.detune.value = (i - 1) * 3;

    osc.connect(gain);
    gain.connect(bus);

    const fadeIn = 0.8;
    const fadeOut = 1.2;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.018 * vol, startTime + fadeIn);
    gain.gain.setValueAtTime(0.018 * vol, startTime + duration - fadeOut);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.1);
  });
}

let phraseIndex = 0;
let chordIndex = 0;

function schedulePhrase(): void {
  if (!isAmbientPlaying) return;

  const ctx = getContext();
  const vol = getMusicVolume();

  if (vol === 0) {
    updateDroneVolume(0);
    const t = setTimeout(schedulePhrase, 2000);
    musicTimers.push(t);
    return;
  }

  updateDroneVolume(vol);

  const now = ctx.currentTime + 0.1;
  const phrase = PHRASES[phraseIndex % PHRASES.length];
  phraseIndex++;

  const chordRoot = CHORD_ROOTS[chordIndex % CHORD_ROOTS.length];
  chordIndex++;

  // Chord lasts the entire phrase
  const phraseDuration = phrase.length * BEAT_SEC;
  playPadChord(chordRoot, now, phraseDuration + 1.5, vol);

  // Schedule melody notes with generous overlap
  for (let i = 0; i < phrase.length; i++) {
    const noteStart = now + i * BEAT_SEC;
    const noteDuration = BEAT_SEC * 1.8; // notes overlap by ~80%
    playMelodyNote(phrase[i], noteStart, noteDuration, vol);
  }

  // Occasional high shimmer for texture
  if (phraseIndex % 3 === 0) {
    const shimmerTime = now + phraseDuration * 0.5;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const bus = getMusicBus();

    osc.type = 'sine';
    osc.frequency.value = phrase[Math.floor(Math.random() * phrase.length)] * 2;

    osc.connect(gain);
    gain.connect(bus);

    gain.gain.setValueAtTime(0, shimmerTime);
    gain.gain.linearRampToValueAtTime(0.012 * vol, shimmerTime + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, shimmerTime + 2.5);

    osc.start(shimmerTime);
    osc.stop(shimmerTime + 2.6);
  }

  // Small pause between phrases for breathing room
  const nextPhraseMs = (phraseDuration + BEAT_SEC * 1.5) * 1000;
  const t = setTimeout(schedulePhrase, nextPhraseMs);
  musicTimers.push(t);
}

export function startAmbientMusic(): void {
  if (isAmbientPlaying) return;
  isAmbientPlaying = true;
  phraseIndex = 0;
  chordIndex = 0;
  startDrone(getMusicVolume());
  schedulePhrase();
}

export function stopAmbientMusic(): void {
  isAmbientPlaying = false;
  musicTimers.forEach(t => clearTimeout(t));
  musicTimers = [];

  const ctx = getContext();
  const now = ctx.currentTime;
  droneNodes.forEach(({ osc, gain }) => {
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.5);
    osc.stop(now + 0.6);
  });
  droneNodes = [];

  masterGain = null;
  reverbNode = null;
  reverbGain = null;
  dryGain = null;
}
