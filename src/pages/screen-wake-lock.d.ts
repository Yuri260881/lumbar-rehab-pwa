/**
 * Minimal Screen Wake Lock API typings.
 *
 * `@types/wicg-screen-wake-lock` is not published on npm, so the handful of
 * members this app uses are declared here instead of pulling in a dependency.
 */

interface WakeLockSentinel extends EventTarget {
  readonly released: boolean;
  readonly type: 'screen';
  release(): Promise<void>;
  onrelease: ((this: WakeLockSentinel, event: Event) => void) | null;
}

interface WakeLock {
  request(type: 'screen'): Promise<WakeLockSentinel>;
}

interface Navigator {
  readonly wakeLock?: WakeLock;
}
