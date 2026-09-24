/**
 * Pure state machine for the static-exercise timer.
 *
 * The machine knows nothing about React, audio or the DOM: it only computes the
 * next state from the current state plus an elapsed-time delta. That makes the
 * countdown, pause, resume, reset and set transitions unit-testable without
 * timers. `useCountdownTimer` in `hooks/` wires it to rAF + cues.
 */

export type TimerPhase = 'idle' | 'hold' | 'rest' | 'finished';

export interface TimerConfig {
  holdSeconds: number;
  sets: number;
  restSeconds: number;
}

export interface TimerState {
  config: TimerConfig;
  phase: TimerPhase;
  running: boolean;
  /** 1-based index of the current set. */
  currentSet: number;
  /** Seconds remaining in the current phase (fractional). */
  remainingSeconds: number;
  completedSets: number;
  totalElapsedSeconds: number;
}

export type TimerEvent =
  | { type: 'hold-complete'; set: number }
  | { type: 'rest-complete'; set: number }
  | { type: 'finished' };

export function createInitialState(config: TimerConfig): TimerState {
  const safe = sanitizeConfig(config);
  return {
    config: safe,
    phase: 'idle',
    running: false,
    currentSet: 1,
    remainingSeconds: safe.holdSeconds,
    completedSets: 0,
    totalElapsedSeconds: 0,
  };
}

export function sanitizeConfig(config: TimerConfig): TimerConfig {
  return {
    holdSeconds: clamp(Math.round(config.holdSeconds), 1, 600),
    sets: clamp(Math.round(config.sets), 1, 20),
    restSeconds: clamp(Math.round(config.restSeconds), 0, 600),
  };
}

export function start(state: TimerState): TimerState {
  if (state.phase === 'idle') {
    return { ...state, phase: 'hold', running: true, remainingSeconds: state.config.holdSeconds };
  }
  return { ...state, running: true };
}

export function pause(state: TimerState): TimerState {
  return { ...state, running: false };
}

export function reset(state: TimerState): TimerState {
  return createInitialState(state.config);
}

export function updateConfig(state: TimerState, config: TimerConfig): TimerState {
  const safe = sanitizeConfig(config);
  const next = createInitialState(safe);
  if (!state.running && state.phase !== 'idle') {
    // Keep the user's position in the program but re-time the phases.
    return { ...next, currentSet: state.currentSet, phase: state.phase === 'rest' ? 'rest' : 'hold', remainingSeconds: phaseDuration(next, state.phase === 'rest' ? 'rest' : 'hold') };
  }
  return next;
}

/** Jump to the next set (skip the current hold / rest). */
export function nextSet(state: TimerState): { state: TimerState; events: TimerEvent[] } {
  if (state.phase === 'finished') return { state, events: [] };
  if (state.phase === 'hold' || state.phase === 'idle') {
    return completeHold(state);
  }
  return completeRest(state);
}

export function phaseDuration(state: TimerState, phase: 'hold' | 'rest'): number {
  return phase === 'hold' ? state.config.holdSeconds : state.config.restSeconds;
}

/**
 * Advance the machine by `deltaSeconds`.
 * Returns the new state plus any boundary events that were crossed, so the
 * caller can fire cues exactly once per transition.
 */
export function tick(
  state: TimerState,
  deltaSeconds: number,
): { state: TimerState; events: TimerEvent[] } {
  if (!state.running || state.phase === 'finished' || state.phase === 'idle') {
    return { state, events: [] };
  }
  let remaining = state.remainingSeconds - deltaSeconds;
  let phase = state.phase;
  let currentSet = state.currentSet;
  let completedSets = state.completedSets;
  const events: TimerEvent[] = [];
  let guard = 0;

  while (remaining <= 0 && guard < 50) {
    guard += 1;
    if (phase === 'hold') {
      completedSets += 1;
      events.push({ type: 'hold-complete', set: currentSet });
      if (completedSets >= state.config.sets) {
        return {
          state: {
            ...state,
            phase: 'finished',
            running: false,
            remainingSeconds: 0,
            completedSets,
            totalElapsedSeconds: state.totalElapsedSeconds + state.remainingSeconds,
          },
          events: [...events, { type: 'finished' }],
        };
      }
      if (state.config.restSeconds <= 0) {
        currentSet += 1;
        phase = 'hold';
        remaining += state.config.holdSeconds;
        events.push({ type: 'rest-complete', set: currentSet - 1 });
        continue;
      }
      phase = 'rest';
      remaining += state.config.restSeconds;
    } else {
      events.push({ type: 'rest-complete', set: currentSet });
      currentSet += 1;
      phase = 'hold';
      remaining += state.config.holdSeconds;
    }
  }

  return {
    state: {
      ...state,
      phase,
      currentSet,
      completedSets,
      remainingSeconds: Math.max(0, remaining),
      totalElapsedSeconds: state.totalElapsedSeconds + deltaSeconds,
    },
    events,
  };
}

function completeHold(state: TimerState): { state: TimerState; events: TimerEvent[] } {
  const events: TimerEvent[] = [{ type: 'hold-complete', set: state.currentSet }];
  const completedSets = state.completedSets + 1;
  if (completedSets >= state.config.sets) {
    return {
      state: { ...state, phase: 'finished', running: false, remainingSeconds: 0, completedSets },
      events: [...events, { type: 'finished' }],
    };
  }
  if (state.config.restSeconds <= 0) {
    return {
      state: {
        ...state,
        phase: 'hold',
        currentSet: state.currentSet + 1,
        completedSets,
        remainingSeconds: state.config.holdSeconds,
      },
      events: [...events, { type: 'rest-complete', set: state.currentSet }],
    };
  }
  return {
    state: {
      ...state,
      phase: 'rest',
      completedSets,
      remainingSeconds: state.config.restSeconds,
    },
    events,
  };
}

function completeRest(state: TimerState): { state: TimerState; events: TimerEvent[] } {
  return {
    state: {
      ...state,
      phase: 'hold',
      currentSet: state.currentSet + 1,
      remainingSeconds: state.config.holdSeconds,
    },
    events: [{ type: 'rest-complete', set: state.currentSet }],
  };
}

export function progressRatio(state: TimerState): number {
  const total = phaseDuration(state, state.phase === 'rest' ? 'rest' : 'hold');
  if (total <= 0) return 0;
  return clamp(1 - state.remainingSeconds / total, 0, 1);
}

export function isStaticExercise(holdSeconds: number): boolean {
  return holdSeconds >= 3;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
