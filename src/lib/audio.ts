/**
 * Short cue tones generated with the Web Audio API.
 *
 * No audio files are shipped, so the app stays offline-capable with zero extra
 * bytes. If the Web Audio API is unavailable (older browsers, blocked audio)
 * every function degrades to a no-op — the timer keeps working.
 */

let context: AudioContext | null = null;
let unlockAttempts = 0;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    context ??= new Ctor();
    return context;
  } catch {
    return null;
  }
}

/** Must be called from a user gesture on browsers that require it. */
export function unlockAudio(): void {
  if (unlockAttempts > 3) return;
  unlockAttempts += 1;
  const audio = getContext();
  if (!audio) return;
  if (audio.state === 'suspended') void audio.resume().catch(() => undefined);
}

export function isAudioSupported(): boolean {
  return getContext() !== null;
}

export function playTone(frequency: number, durationMs = 180, volume = 0.18): void {
  const audio = getContext();
  if (!audio) return;
  if (audio.state === 'suspended') void audio.resume().catch(() => undefined);
  try {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    const now = audio.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(now);
    oscillator.stop(now + durationMs / 1000 + 0.02);
  } catch {
    /* audio unavailable — silent fallback */
  }
}

/** End-of-set cue. */
export function playSetCue(): void {
  playTone(880, 160);
  window.setTimeout(() => playTone(1174, 200), 170);
}

/** Rest-finished cue. */
export function playGoCue(): void {
  playTone(660, 140);
}

/** Soft tick for the last seconds of a hold. */
export function playTick(): void {
  playTone(520, 60, 0.08);
}
