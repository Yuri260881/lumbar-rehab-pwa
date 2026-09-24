/** Vibration feedback with a safe no-op fallback. */

export function isVibrationSupported(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}

export function vibrate(pattern: number | number[]): void {
  if (!isVibrationSupported()) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* ignore: some browsers throw when the page is not focused */
  }
}

export function vibrateEnd(): void {
  vibrate([120, 60, 120]);
}

export function vibrateTick(): void {
  vibrate(30);
}

export function stopVibration(): void {
  if (!isVibrationSupported()) return;
  try {
    navigator.vibrate(0);
  } catch {
    /* ignore */
  }
}
