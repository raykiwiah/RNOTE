/**
 * A tiny, synthesized ambient soundscape for the Odysseus skin: a distant,
 * calm sea. It is generated entirely with the Web Audio API (brown noise →
 * low-pass filter → slow swell LFO), so there are no audio assets to download —
 * it stays offline-first and weightless.
 *
 * It is strictly opt-in and very quiet, and only ever starts from a user gesture
 * (browsers block autoplay). All calls are safe no-ops where Web Audio is
 * unavailable (e.g. in tests).
 */
type AudioContextCtor = typeof AudioContext;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let sources: AudioScheduledSourceNode[] = [];
let helpers: AudioNode[] = [];
let running = false;

const TARGET_VOLUME = 0.06; // deliberately faint — a horizon, not a foreground

function audioCtor(): AudioContextCtor | undefined {
  if (typeof window === 'undefined') return undefined;
  return (
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext
  );
}

export function isSoundSupported(): boolean {
  return audioCtor() !== undefined;
}

/** A few seconds of looping brown noise — the body of the "waves". */
function brownNoise(context: AudioContext): AudioBuffer {
  const length = context.sampleRate * 3;
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < length; i += 1) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.5;
  }
  return buffer;
}

export async function startSoundscape(): Promise<void> {
  if (running) return;
  const Ctor = audioCtor();
  if (!Ctor) return;

  ctx = ctx ?? new Ctor();
  if (ctx.state === 'suspended') {
    await ctx.resume().catch(() => undefined);
  }

  master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  const src = ctx.createBufferSource();
  src.buffer = brownNoise(ctx);
  src.loop = true;

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 480;
  lowpass.Q.value = 0.6;

  // Slow swell so the sea breathes rather than hisses.
  const swell = ctx.createGain();
  swell.gain.value = 0.55;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.08;
  const lfoDepth = ctx.createGain();
  lfoDepth.gain.value = 0.35;
  lfo.connect(lfoDepth).connect(swell.gain);

  src.connect(lowpass).connect(swell).connect(master);
  src.start();
  lfo.start();

  const now = ctx.currentTime;
  master.gain.cancelScheduledValues(now);
  master.gain.setValueAtTime(0, now);
  master.gain.linearRampToValueAtTime(TARGET_VOLUME, now + 2.5);

  sources = [src, lfo];
  helpers = [lowpass, swell, lfoDepth];
  running = true;

  // If autoplay policy left the context suspended (e.g. after a reload with the
  // setting already on), resume on the first user gesture.
  if (ctx.state === 'suspended') {
    const resume = (): void => {
      void ctx?.resume();
      window.removeEventListener('pointerdown', resume);
    };
    window.addEventListener('pointerdown', resume, { once: true });
  }
}

export function stopSoundscape(): void {
  if (!running || !ctx || !master) return;
  const now = ctx.currentTime;
  master.gain.cancelScheduledValues(now);
  master.gain.setValueAtTime(master.gain.value, now);
  master.gain.linearRampToValueAtTime(0, now + 0.6);

  const stopping = sources;
  const disconnecting = [...helpers, master];
  window.setTimeout(() => {
    for (const node of stopping) {
      try {
        node.stop();
        node.disconnect();
      } catch {
        /* already stopped */
      }
    }
    for (const node of disconnecting) {
      try {
        node.disconnect();
      } catch {
        /* ignore */
      }
    }
  }, 700);

  running = false;
  sources = [];
  helpers = [];
  master = null;
}

/**
 * A short, synthesized flourish for a discrete moment. 'capture' is a soft quill
 * tick as a thought is preserved; 'achievement' is a small rising lyre. Reuses
 * the ambient context when present; a no-op where Web Audio is unavailable.
 */
export function playCue(type: 'capture' | 'achievement'): void {
  const Ctor = audioCtor();
  if (!Ctor) return;
  ctx = ctx ?? new Ctor();
  if (ctx.state === 'suspended') void ctx.resume();
  const now = ctx.currentTime;

  const tone = (freq: number, at: number, dur: number, peak: number, kind: OscillatorType): void => {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    osc.type = kind;
    osc.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(peak, at + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(at);
    osc.stop(at + dur + 0.05);
  };

  if (type === 'capture') {
    tone(880, now, 0.14, 0.07, 'triangle');
  } else {
    // A gentle C-major arpeggio, like a plucked lyre.
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, now + i * 0.085, 0.5, 0.075, 'sine'));
  }
}
