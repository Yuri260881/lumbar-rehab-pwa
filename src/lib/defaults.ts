import type { AppData, Preferences } from '../types';
import { NO_RED_FLAGS } from '../types';

export const DATA_VERSION = 1;

export const DEFAULT_PREFERENCES: Preferences = {
  disclaimerAccepted: false,
  displayName: '',
  program: {
    // Sensible, conservative default: warm-up → mobility → light
    // stabilisation → gentle stretching → breathing. Statics and advanced
    // strengthening are NOT in the default program — the user adds them
    // consciously (and, ideally, after a clinician has reviewed the plan).
    exerciseIds: [
      'warmup-breathing-standing',
      'pelvic-tilt',
      'knee-rolls',
      'cat-camel',
      'abdominal-bracing',
      'heel-slide',
      'knee-to-chest',
      'diaphragmatic-breathing',
    ],
    flareOnly: false,
  },
  timer: {
    holdSeconds: 10,
    sets: 3,
    restSeconds: 30,
    sound: true,
    vibration: true,
    wakeLock: true,
  },
  reminders: {
    workout: { enabled: false, time: '08:00' },
    inversion: { enabled: false, time: '09:00', everyNDays: 2 },
  },
  inversionAnchorDate: null,
  inversionDoctorApproved: false,
  reducedMotion: false,
};

export function createDefaultData(): AppData {
  return {
    version: DATA_VERSION,
    preferences: structuredCloneSafe(DEFAULT_PREFERENCES),
    entries: [],
    sessions: [],
    inversionSessions: [],
    redFlags: { ...NO_RED_FLAGS },
    redFlagsCheckedAt: null,
  };
}

/** Migrate older payloads forward. Keep it additive and defensive. */
export function migrateData(raw: unknown): AppData {
  const base = createDefaultData();
  if (!raw || typeof raw !== 'object') return base;
  const candidate = raw as Partial<AppData>;
  const preferences = (candidate.preferences ?? {}) as Partial<Preferences>;
  return {
    version: DATA_VERSION,
    preferences: {
      ...base.preferences,
      ...preferences,
      program: { ...base.preferences.program, ...(preferences.program ?? {}) },
      timer: { ...base.preferences.timer, ...(preferences.timer ?? {}) },
      reminders: {
        workout: {
          ...base.preferences.reminders.workout,
          ...(preferences.reminders?.workout ?? {}),
        },
        inversion: {
          ...base.preferences.reminders.inversion,
          ...(preferences.reminders?.inversion ?? {}),
        },
      },
    },
    entries: Array.isArray(candidate.entries) ? candidate.entries : [],
    sessions: Array.isArray(candidate.sessions) ? candidate.sessions : [],
    inversionSessions: Array.isArray(candidate.inversionSessions)
      ? candidate.inversionSessions
      : [],
    redFlags: { ...NO_RED_FLAGS, ...(candidate.redFlags ?? {}) },
    redFlagsCheckedAt: candidate.redFlagsCheckedAt ?? null,
  };
}

function structuredCloneSafe<T>(value: T): T {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}
