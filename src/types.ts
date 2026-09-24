/**
 * Core domain types for Lumbar Rehab Dashboard.
 *
 * Design rule enforced everywhere in this codebase: the app never diagnoses,
 * never prescribes and never promises an outcome. It records, reminds and
 * explains, always pointing back to a qualified clinician.
 */

export type ExerciseCategoryId =
  | 'warmup'
  | 'mobility'
  | 'stabilisation'
  | 'strengthening'
  | 'stretching'
  | 'static'
  | 'recovery';

export interface ExerciseCategory {
  id: ExerciseCategoryId;
  name: string;
  shortName: string;
  goal: string;
}

export type DosingUnit = 'seconds' | 'reps';
export type Difficulty = 'gentle' | 'moderate' | 'advanced';

export interface SourceRef {
  /** Organisation name, e.g. "NHS", "NICE", "AAOS OrthoInfo". */
  organisation: string;
  /** Page title as it appeared at access time. */
  title: string;
  url: string;
  /** ISO date (YYYY-MM-DD) the source was opened and read. */
  accessedOn: string;
  /** Optional note about what the source supports. */
  note?: string;
}

export interface Dosing {
  unit: DosingUnit;
  /** Seconds per hold, or repetitions per set. */
  value: number;
  sets: number;
  /** Seconds of rest between sets. */
  restSeconds: number;
  /** Free-text dosing exactly as the source phrases it, if useful. */
  sourceWording?: string;
}

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategoryId;
  /** One-sentence, non-promissory purpose. */
  purpose: string;
  /** Anatomical sketch description: base pose + highlighted structures. */
  sketch: {
    pose: SketchPose;
    highlight: SketchHighlight[];
  };
  startingPosition: string;
  steps: string[];
  breathing: string;
  dosing: Dosing;
  difficulty: Difficulty;
  /** What this exercise must NOT be used for / when to skip it. */
  contraindications: string[];
  /** Immediate-stop signals. */
  stopSignals: string[];
  sources: SourceRef[];
  /** Optional extra caution shown on the card. */
  caution?: string;
  /** Marks the exercise as usable in a "flare / gentle day" program. */
  flareSafe: boolean;
}

export type SketchPose =
  | 'supine'
  | 'supine-knees'
  | 'prone'
  | 'prone-pressup'
  | 'quadruped'
  | 'side-left'
  | 'seated'
  | 'standing'
  | 'standing-hinge'
  | 'walking'
  | 'breathing';

export type SketchHighlight =
  | 'lumbar'
  | 'abdomen'
  | 'glutes'
  | 'hamstrings'
  | 'hip-flexors'
  | 'side'
  | 'leg'
  | 'arm'
  | 'diaphragm'
  | 'whole-back';

export type SleepQuality = 1 | 2 | 3 | 4 | 5;

export interface DiaryEntry {
  id: string;
  /** ISO date-time of creation, local. */
  createdAt: string;
  /** Local calendar date, YYYY-MM-DD. */
  date: string;
  pain: number | null;
  numbness: boolean;
  weakness: boolean;
  sleepQuality: SleepQuality | null;
  /** Exercise ids performed that day. */
  exercises: string[];
  /** "How did the body react a few hours later?" */
  delayedReaction: string;
  note: string;
}

export interface WorkoutSession {
  id: string;
  date: string;
  startedAt: string;
  finishedAt: string;
  exerciseIds: string[];
  completedExerciseIds: string[];
  /** Whether the user reported pain increasing during the session. */
  painIncreased: boolean;
  stoppedEarly: boolean;
  durationSeconds: number;
}

export interface ReminderSettings {
  workout: {
    enabled: boolean;
    /** "HH:MM" in 24h local time. */
    time: string;
    /** ISO date-time of the last shown/snoozed slot. */
    lastFiredOn?: string;
    /** ISO date-time to defer until (snooze). */
    snoozedUntil?: string;
  };
  inversion: {
    enabled: boolean;
    time: string;
    /** Cadence in days; the app never changes this without the user. */
    everyNDays: number;
    lastFiredOn?: string;
    snoozedUntil?: string;
  };
}

export interface InversionSession {
  id: string;
  /** Local calendar date, YYYY-MM-DD. */
  date: string;
  /** 'done' = used the table, 'skipped' = consciously skipped the day. */
  status: 'done' | 'skipped';
  /** Free text. The app never asks for, stores or suggests an angle or duration. */
  note: string;
  /** How the user felt afterwards, in their own words. */
  feltAfter: string;
  /** Any warning symptom appeared during/after the session. */
  warningSymptoms: boolean;
}

export interface RedFlags {
  bladderBowel: boolean;
  saddleNumbness: boolean;
  progressiveWeakness: boolean;
  suddenSensoryLoss: boolean;
  painAfterTrauma: boolean;
  feverOrUnwell: boolean;
}

export interface Preferences {
  /** Shown once before the first session. */
  disclaimerAccepted: boolean;
  /** Optional, never used for medical decisions. */
  displayName: string;
  program: {
    exerciseIds: string[];
    flareOnly: boolean;
  };
  timer: {
    holdSeconds: number;
    sets: number;
    restSeconds: number;
    sound: boolean;
    vibration: boolean;
    wakeLock: boolean;
  };
  reminders: ReminderSettings;
  /** Reference date for the every-other-day inversion cadence. */
  inversionAnchorDate: string | null;
  /** Explicit user statement that a doctor allowed using the table. */
  inversionDoctorApproved: boolean;
  reducedMotion: boolean;
}

export interface AppData {
  version: number;
  preferences: Preferences;
  entries: DiaryEntry[];
  sessions: WorkoutSession[];
  inversionSessions: InversionSession[];
  redFlags: RedFlags;
  /** ISO date-time of the most recent red-flag acknowledgement. */
  redFlagsCheckedAt: string | null;
}

export interface ScheduledReminder {
  id: string;
  kind: 'workout' | 'inversion';
  title: string;
  body: string;
  /** ISO date-time. */
  dueAt: string;
  fired: boolean;
}

export const RED_FLAG_FIELDS: ReadonlyArray<{
  key: keyof RedFlags;
  label: string;
  detail: string;
}> = [
  {
    key: 'bladderBowel',
    label: 'Потеря контроля над мочеиспусканием или кишечником',
    detail:
      'В том числе невозможность начать мочеиспускание, задержка мочи или недержание — если это не является для вас обычной ситуацией.',
  },
  {
    key: 'saddleNumbness',
    label: 'Онемение в области промежности',
    detail:
      'Онемение или потеря чувствительности вокруг гениталий, ануса, внутренней поверхности бёдер («седловидная» зона).',
  },
  {
    key: 'progressiveWeakness',
    label: 'Быстро нарастающая слабость в ноге',
    detail:
      'Слабость, из-за которой подворачивается стопа, трудно встать на носки или на пятки, нога «не слушается».',
  },
  {
    key: 'suddenSensoryLoss',
    label: 'Внезапная потеря чувствительности',
    detail: 'Внезапно возникшее или быстро расширяющееся онемение в ноге, стопе или обеих ногах.',
  },
  {
    key: 'painAfterTrauma',
    label: 'Сильная боль после травмы',
    detail: 'Боль, возникшая после падения, аварии или другого серьёзного происшествия.',
  },
  {
    key: 'feverOrUnwell',
    label: 'Высокая температура или другие тревожные симптомы',
    detail:
      'Лихорадка, озноб, общее недомогание, необъяснимая потеря веса, боль, усиливающаяся ночью, отёк или изменение формы спины.',
  },
];

export const NO_RED_FLAGS: RedFlags = {
  bladderBowel: false,
  saddleNumbness: false,
  progressiveWeakness: false,
  suddenSensoryLoss: false,
  painAfterTrauma: false,
  feverOrUnwell: false,
};

export function hasRedFlags(flags: RedFlags): boolean {
  return (Object.keys(flags) as Array<keyof RedFlags>).some((key) => flags[key]);
}
