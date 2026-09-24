import { useCallback, useEffect, useRef, useState } from 'react';
import type { TimerConfig, TimerEvent, TimerState } from '../lib/timer';
import { createInitialState, nextSet, pause, reset, start, tick, updateConfig } from '../lib/timer';
import { playGoCue, playSetCue, playTick, unlockAudio } from '../lib/audio';
import { stopVibration, vibrateEnd, vibrateTick } from '../lib/haptics';
import { WakeLockController } from '../lib/wakeLock';

interface Options {
  sound: boolean;
  vibration: boolean;
  wakeLock: boolean;
  onFinished?: (state: TimerState) => void;
}

/**
 * rAF-driven countdown bound to the pure timer state machine.
 *
 * Uses a monotonic clock (performance.now) so the countdown stays accurate when
 * the tab is throttled, and re-syncs when the page becomes visible again.
 */
export function useCountdownTimer(initialConfig: TimerConfig, options: Options) {
  const [state, setState] = useState<TimerState>(() => createInitialState(initialConfig));
  const stateRef = useRef(state);
  stateRef.current = state;

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  const wakeLockRef = useRef(new WakeLockController());
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [wakeLockSupported, setWakeLockSupported] = useState(false);

  const handleEvents = useCallback((events: TimerEvent[]) => {
    const { sound, vibration, onFinished } = optionsRef.current;
    for (const event of events) {
      if (event.type === 'hold-complete') {
        if (sound) playSetCue();
        if (vibration) vibrateEnd();
      }
      if (event.type === 'rest-complete') {
        if (sound) playGoCue();
        if (vibration) vibrateTick();
      }
      if (event.type === 'finished') {
        if (sound) playSetCue();
        if (vibration) vibrateEnd();
        onFinished?.(stateRef.current);
      }
    }
  }, []);

  const loop = useCallback(
    (now: number) => {
      const previous = lastTickRef.current || now;
      const delta = Math.min(5, Math.max(0, (now - previous) / 1000));
      lastTickRef.current = now;

      const current = stateRef.current;
      if (current.running) {
        const secondsLeftBefore = Math.ceil(current.remainingSeconds);
        const { state: next, events } = tick(current, delta);
        const secondsLeftAfter = Math.ceil(next.remainingSeconds);
        if (secondsLeftAfter !== secondsLeftBefore && secondsLeftAfter <= 3 && secondsLeftAfter > 0) {
          if (optionsRef.current.sound) playTick();
          if (optionsRef.current.vibration) vibrateTick();
        }
        if (events.length) handleEvents(events);
        stateRef.current = next;
        setState(next);
        if (next.running) {
          rafRef.current = window.requestAnimationFrame(loop);
          return;
        }
        void wakeLockRef.current.release().then(() => setWakeLockActive(false));
        return;
      }
      rafRef.current = null;
    },
    [handleEvents],
  );

  const ensureRunning = useCallback(() => {
    if (rafRef.current !== null) return;
    lastTickRef.current = 0;
    rafRef.current = window.requestAnimationFrame(loop);
  }, [loop]);

  const startTimer = useCallback(() => {
    unlockAudio();
    const next = start(stateRef.current);
    stateRef.current = next;
    setState(next);
    ensureRunning();
    if (optionsRef.current.wakeLock) {
      void wakeLockRef.current.acquire().then((acquired) => {
        setWakeLockActive(acquired);
        setWakeLockSupported(true);
      });
    }
  }, [ensureRunning]);

  const pauseTimer = useCallback(() => {
    const next = pause(stateRef.current);
    stateRef.current = next;
    setState(next);
    stopVibration();
    void wakeLockRef.current.release().then(() => setWakeLockActive(false));
  }, []);

  const resetTimer = useCallback(() => {
    const next = reset(stateRef.current);
    stateRef.current = next;
    setState(next);
    stopVibration();
    void wakeLockRef.current.release().then(() => setWakeLockActive(false));
  }, []);

  const skipToNextSet = useCallback(() => {
    const { state: next, events } = nextSet(stateRef.current);
    if (events.length) handleEvents(events);
    stateRef.current = next;
    setState(next);
    if (next.running) ensureRunning();
  }, [ensureRunning, handleEvents]);

  const changeConfig = useCallback((config: TimerConfig) => {
    const next = updateConfig(stateRef.current, config);
    stateRef.current = next;
    setState(next);
  }, []);

  // Re-acquire the wake lock when returning to the tab, re-sync the clock.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      lastTickRef.current = 0;
      if (stateRef.current.running) {
        ensureRunning();
        if (optionsRef.current.wakeLock) {
          void wakeLockRef.current.reacquireIfReleased().then(setWakeLockActive);
        }
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [ensureRunning]);

  // Release everything on unmount so the screen can sleep again.
  useEffect(() => {
    const wakeLock = wakeLockRef.current;
    return () => {
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
      stopVibration();
      void wakeLock.release();
    };
  }, []);

  return {
    state,
    startTimer,
    pauseTimer,
    resetTimer,
    skipToNextSet,
    changeConfig,
    wakeLockActive,
    wakeLockSupported,
  };
}
