/**
 * Screen Wake Lock helper.
 *
 * Used only while a workout timer is running, so the screen does not switch off
 * during a hold. Released on pause/stop/page hide. If the API is missing
 * (Firefox, older Android WebView, desktop browsers) everything degrades to a
 * normal timer — no error is surfaced to the user.
 */

export function isWakeLockSupported(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.wakeLock?.request === 'function';
}

export class WakeLockController {
  private sentinel: WakeLockSentinel | null = null;
  private releasedByBrowser = false;

  get active(): boolean {
    return this.sentinel !== null && !this.sentinel.released;
  }

  /** Returns true when the lock was acquired. */
  async acquire(): Promise<boolean> {
    if (!isWakeLockSupported()) return false;
    if (this.active) return true;
    try {
      this.sentinel = await navigator.wakeLock?.request('screen') ?? null;
      if (this.sentinel) {
        this.releasedByBrowser = false;
        this.sentinel.addEventListener('release', () => {
          this.releasedByBrowser = true;
          this.sentinel = null;
        });
        return true;
      }
      return false;
    } catch {
      this.sentinel = null;
      return false;
    }
  }

  /** Re-acquire after the browser auto-released the lock (e.g. tab hidden). */
  async reacquireIfReleased(): Promise<boolean> {
    if (!this.releasedByBrowser) return this.active;
    return this.acquire();
  }

  async release(): Promise<void> {
    const current = this.sentinel;
    this.sentinel = null;
    this.releasedByBrowser = false;
    if (!current || current.released) return;
    try {
      await current.release();
    } catch {
      /* already released */
    }
  }
}
