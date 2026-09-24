import { describe, expect, it } from 'vitest';
import {
  createInitialState,
  nextSet,
  pause,
  progressRatio,
  reset,
  sanitizeConfig,
  start,
  tick,
  updateConfig,
} from './timer';

const config = { holdSeconds: 10, sets: 3, restSeconds: 5 };

describe('sanitizeConfig', () => {
  it('clamps impossible values into a safe range', () => {
    expect(sanitizeConfig({ holdSeconds: 0, sets: 0, restSeconds: -5 })).toEqual({
      holdSeconds: 1,
      sets: 1,
      restSeconds: 0,
    });
    expect(sanitizeConfig({ holdSeconds: 9999, sets: 99, restSeconds: 9999 })).toEqual({
      holdSeconds: 600,
      sets: 20,
      restSeconds: 600,
    });
  });
});

describe('timer state machine', () => {
  it('starts in the hold phase of set 1', () => {
    const state = start(createInitialState(config));
    expect(state.phase).toBe('hold');
    expect(state.currentSet).toBe(1);
    expect(state.remainingSeconds).toBe(10);
    expect(state.running).toBe(true);
  });

  it('counts down and crosses into rest exactly once', () => {
    let { state, events } = tick(start(createInitialState(config)), 4);
    expect(events).toHaveLength(0);
    expect(state.remainingSeconds).toBe(6);

    ({ state, events } = tick(state, 6));
    expect(events).toEqual([{ type: 'hold-complete', set: 1 }]);
    expect(state.phase).toBe('rest');
    expect(state.remainingSeconds).toBe(5);
    expect(state.completedSets).toBe(1);
  });

  it('moves to the next set after rest', () => {
    let state = start(createInitialState(config));
    ({ state } = tick(state, 10));
    const { state: afterRest } = tick(state, 5);
    expect(afterRest.phase).toBe('hold');
    expect(afterRest.currentSet).toBe(2);
    expect(afterRest.remainingSeconds).toBe(10);
  });

  it('finishes after the last set without starting an extra rest', () => {
    let state = start(createInitialState(config));
    for (let index = 0; index < 2; index += 1) {
      ({ state } = tick(state, 10));
      ({ state } = tick(state, 5));
    }
    expect(state.currentSet).toBe(3);
    const { state: final, events } = tick(state, 10);
    expect(final.phase).toBe('finished');
    expect(final.running).toBe(false);
    expect(final.completedSets).toBe(3);
    expect(events.map((event) => event.type)).toEqual(['hold-complete', 'finished']);
  });

  it('handles a single huge tick that spans several phases', () => {
    const { state, events } = tick(start(createInitialState(config)), 40);
    expect(state.phase).toBe('finished');
    expect(state.completedSets).toBe(3);
    expect(events.filter((event) => event.type === 'hold-complete')).toHaveLength(3);
  });

  it('pauses and resumes without losing the remaining time', () => {
    let state = start(createInitialState(config));
    ({ state } = tick(state, 3));
    state = pause(state);
    const paused = tick(state, 100);
    expect(paused.state.remainingSeconds).toBe(7);
    expect(paused.events).toHaveLength(0);
    const resumed = tick(start(state), 2);
    expect(resumed.state.remainingSeconds).toBe(5);
  });

  it('reset returns to the initial state', () => {
    let state = start(createInitialState(config));
    ({ state } = tick(state, 12));
    const fresh = reset(state);
    expect(fresh.phase).toBe('idle');
    expect(fresh.currentSet).toBe(1);
    expect(fresh.completedSets).toBe(0);
    expect(fresh.remainingSeconds).toBe(10);
  });

  it('nextSet skips the current hold and goes to rest', () => {
    const state = start(createInitialState(config));
    const { state: skipped, events } = nextSet(state);
    expect(skipped.phase).toBe('rest');
    expect(skipped.completedSets).toBe(1);
    expect(events[0]).toEqual({ type: 'hold-complete', set: 1 });
  });

  it('nextSet from rest goes straight to the next hold', () => {
    let state = start(createInitialState(config));
    ({ state } = tick(state, 10));
    const { state: after } = nextSet(state);
    expect(after.phase).toBe('hold');
    expect(after.currentSet).toBe(2);
  });

  it('supports zero rest by chaining holds', () => {
    const zeroRest = { holdSeconds: 5, sets: 2, restSeconds: 0 };
    const state = start(createInitialState(zeroRest));
    const { state: after } = tick(state, 5);
    expect(after.phase).toBe('hold');
    expect(after.currentSet).toBe(2);
  });

  it('recomputes phases when the user changes duration mid-workout', () => {
    const state = pause(start(createInitialState(config)));
    const updated = updateConfig(state, { holdSeconds: 20, sets: 3, restSeconds: 5 });
    expect(updated.config.holdSeconds).toBe(20);
    expect(updated.remainingSeconds).toBe(20);
    expect(updated.currentSet).toBe(1);
  });

  it('reports progress ratio within the current phase', () => {
    let state = start(createInitialState(config));
    expect(progressRatio(state)).toBe(0);
    ({ state } = tick(state, 5));
    expect(progressRatio(state)).toBeCloseTo(0.5);
  });
});
