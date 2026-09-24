import { describe, expect, it } from 'vitest';
import { CATEGORIES, EXERCISES, EXERCISES_BY_ID, exercisesByCategory } from './exercises';
import { ALL_SOURCES, SOURCES } from './sources';
import { DEFAULT_PREFERENCES } from '../lib/defaults';
import type { Exercise } from '../types';

const FORBIDDEN_PROMISES = [
  'вылечит',
  'излечит',
  'устранит грыжу',
  'рассасывание грыжи',
  'рассосёт',
  'гарантированно',
  'полное выздоровление',
  '100%',
];

const URL_PATTERN = /^https:\/\/[^\s]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

describe('exercise library integrity', () => {
  it('has unique ids', () => {
    const ids = EXERCISES.map((exercise) => exercise.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('covers all seven categories', () => {
    const used = new Set(EXERCISES.map((exercise) => exercise.category));
    for (const category of CATEGORIES) {
      expect(used.has(category.id), `category ${category.id} has no exercises`).toBe(true);
    }
  });

  it('keeps the library small and purposeful (no filler exercises)', () => {
    expect(EXERCISES.length).toBeGreaterThanOrEqual(18);
    expect(EXERCISES.length).toBeLessThanOrEqual(30);
  });

  it('gives every exercise a cited, dated source', () => {
    for (const exercise of EXERCISES) {
      expect(exercise.sources.length, `${exercise.id}: no sources`).toBeGreaterThan(0);
      for (const ref of exercise.sources) {
        expect(ref.url, `${exercise.id}: bad url`).toMatch(URL_PATTERN);
        expect(ref.accessedOn, `${exercise.id}: bad access date`).toMatch(DATE_PATTERN);
        expect(ref.organisation.trim().length).toBeGreaterThan(1);
        expect(ref.title.trim().length).toBeGreaterThan(1);
      }
    }
  });

  it('documents contraindications and stop signals for every exercise', () => {
    for (const exercise of EXERCISES) {
      expect(exercise.contraindications.length, `${exercise.id}: contraindications`).toBeGreaterThan(0);
      expect(exercise.stopSignals.length, `${exercise.id}: stop signals`).toBeGreaterThan(2);
      expect(exercise.steps.length, `${exercise.id}: steps`).toBeGreaterThanOrEqual(3);
      expect(exercise.breathing.trim().length, `${exercise.id}: breathing`).toBeGreaterThan(3);
      expect(exercise.startingPosition.trim().length, `${exercise.id}: starting position`).toBeGreaterThan(3);
    }
  });

  it('keeps dosing inside clinically sane bounds', () => {
    for (const exercise of EXERCISES) {
      const { value, sets, restSeconds } = exercise.dosing;
      expect(value, `${exercise.id}: value`).toBeGreaterThan(0);
      expect(sets, `${exercise.id}: sets`).toBeGreaterThanOrEqual(1);
      expect(sets, `${exercise.id}: too many sets`).toBeLessThanOrEqual(10);
      expect(restSeconds, `${exercise.id}: rest`).toBeGreaterThanOrEqual(0);
      if (exercise.dosing.unit === 'seconds') {
        expect(value, `${exercise.id}: absurd hold`).toBeLessThanOrEqual(300);
      } else {
        expect(value, `${exercise.id}: absurd reps`).toBeLessThanOrEqual(50);
      }
    }
  });

  it('never promises a cure or a guaranteed outcome', () => {
    const haystack = JSON.stringify(EXERCISES).toLowerCase();
    for (const phrase of FORBIDDEN_PROMISES) {
      expect(haystack, `forbidden phrase: ${phrase}`).not.toContain(phrase.toLowerCase());
    }
  });

  it('exposes a lookup index and category filter', () => {
    expect(EXERCISES_BY_ID['pelvic-tilt']?.name).toContain('Наклон таза');
    expect(exercisesByCategory('static').length).toBeGreaterThan(0);
    expect(exercisesByCategory('all')).toHaveLength(EXERCISES.length);
  });

  it('marks advanced directional exercises as not flare-safe', () => {
    const directional = ['prone-pressup', 'standing-back-extension'];
    for (const id of directional) {
      expect(EXERCISES_BY_ID[id].flareSafe, `${id} should not be flare-safe`).toBe(false);
      expect(EXERCISES_BY_ID[id].caution, `${id} needs a caution note`).toBeTruthy();
    }
  });
});

describe('default program', () => {
  it('only references existing exercises', () => {
    for (const id of DEFAULT_PREFERENCES.program.exerciseIds) {
      expect(EXERCISES_BY_ID[id], `unknown exercise ${id}`).toBeTruthy();
    }
  });

  it('starts gentle: no advanced directional exercise by default', () => {
    for (const id of DEFAULT_PREFERENCES.program.exerciseIds) {
      const exercise = EXERCISES_BY_ID[id];
      expect(exercise.difficulty, `${id} is too advanced for the default program`).not.toBe(
        'advanced',
      );
    }
  });

  it('includes a flare-safe subset for painful days', () => {
    const flareSafe = EXERCISES.filter((exercise: Exercise) => exercise.flareSafe);
    expect(flareSafe.length).toBeGreaterThanOrEqual(8);
  });
});

describe('source registry', () => {
  it('only cites authoritative organisations', () => {
    const allowed = [
      'NHS',
      'NICE',
      'AAOS',
      'AANS',
      'Mayo Clinic',
      'Cleveland Clinic',
      'American College of Physicians',
      'McGill',
      'WFNS',
      'Peer-reviewed',
      'Систематический обзор',
      // Secondary review used only for the inversion contraindication list.
      'Medical News Today',
    ];
    for (const ref of ALL_SOURCES) {
      const ok = allowed.some((marker) => ref.organisation.includes(marker));
      expect(ok, `unexpected organisation: ${ref.organisation}`).toBe(true);
      expect(ref.url).toMatch(URL_PATTERN);
      expect(ref.accessedOn).toBe('2026-09-24');
    }
  });

  it('contains the safety-critical guidance entries', () => {
    expect(SOURCES.niceNg59.url).toContain('nice.org.uk');
    expect(SOURCES.nhsSciatica.url).toContain('nhs.uk');
    expect(SOURCES.acp2017.title).toContain('Ann Intern Med');
  });
});
