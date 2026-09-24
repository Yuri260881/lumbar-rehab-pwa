import { beforeEach, describe, expect, it } from 'vitest';
import { DataStore } from './dataStore';
import { LocalStorageStore, MemoryStore } from './storage';
import type { DiaryEntry, InversionSession, WorkoutSession } from '../types';
import { createDefaultData, migrateData } from './defaults';
import { DEFAULT_PREFERENCES } from './defaults';

function entry(overrides: Partial<DiaryEntry> = {}): DiaryEntry {
  return {
    id: 'entry-1',
    createdAt: '2026-09-24T08:00:00.000Z',
    date: '2026-09-24',
    pain: 4,
    numbness: false,
    weakness: false,
    sleepQuality: 3,
    exercises: ['pelvic-tilt'],
    delayedReaction: '',
    note: '',
    ...overrides,
  };
}

function session(): WorkoutSession {
  return {
    id: 'session-1',
    date: '2026-09-24',
    startedAt: '2026-09-24T08:00:00.000Z',
    finishedAt: '2026-09-24T08:20:00.000Z',
    exerciseIds: ['pelvic-tilt', 'bird-dog'],
    completedExerciseIds: ['pelvic-tilt', 'bird-dog'],
    painIncreased: false,
    stoppedEarly: false,
    durationSeconds: 1200,
  };
}

describe('defaults and migration', () => {
  it('creates an empty, non-accepted dataset', () => {
    const data = createDefaultData();
    expect(data.preferences.disclaimerAccepted).toBe(false);
    expect(data.entries).toHaveLength(0);
    expect(data.redFlags.bladderBowel).toBe(false);
  });

  it('fills missing fields when migrating a partial payload', () => {
    const migrated = migrateData({ preferences: { displayName: 'Анна' }, entries: null });
    expect(migrated.preferences.displayName).toBe('Анна');
    expect(migrated.preferences.timer.holdSeconds).toBe(DEFAULT_PREFERENCES.timer.holdSeconds);
    expect(migrated.entries).toEqual([]);
  });

  it('returns defaults for garbage input', () => {
    expect(migrateData('nonsense').version).toBe(1);
    expect(migrateData(undefined).entries).toEqual([]);
  });
});

describe('DataStore over MemoryStore', () => {
  let store: DataStore;

  beforeEach(() => {
    store = new DataStore(new MemoryStore());
  });

  it('round-trips preferences', async () => {
    const data = await store.load();
    await store.setPreferences({ ...data.preferences, displayName: 'Иван' });
    const reloaded = await store.load();
    expect(reloaded.preferences.displayName).toBe('Иван');
  });

  it('keeps diary entries sorted newest first and de-duplicates by id', async () => {
    await store.addEntry(entry({ id: 'a', createdAt: '2026-09-20T10:00:00.000Z' }));
    await store.addEntry(entry({ id: 'b', createdAt: '2026-09-24T10:00:00.000Z' }));
    await store.addEntry(entry({ id: 'a', createdAt: '2026-09-21T10:00:00.000Z', note: 'updated' }));
    const data = await store.load();
    expect(data.entries.map((item) => item.id)).toEqual(['b', 'a']);
    expect(data.entries.find((item) => item.id === 'a')?.note).toBe('updated');
  });

  it('deletes an entry', async () => {
    await store.addEntry(entry());
    await store.deleteEntry('entry-1');
    expect((await store.load()).entries).toHaveLength(0);
  });

  it('stores workout sessions', async () => {
    await store.addSession(session());
    const data = await store.load();
    expect(data.sessions[0].completedExerciseIds).toHaveLength(2);
  });

  it('keeps one inversion record per calendar day', async () => {
    const first: InversionSession = {
      id: 'inv-1',
      date: '2026-09-24',
      status: 'done',
      note: '',
      feltAfter: 'нормально',
      warningSymptoms: false,
    };
    await store.addInversionSession(first);
    await store.addInversionSession({ ...first, id: 'inv-2', status: 'skipped', feltAfter: '' });
    const data = await store.load();
    expect(data.inversionSessions).toHaveLength(1);
    expect(data.inversionSessions[0].status).toBe('skipped');
  });

  it('records and clears red flags with a timestamp', async () => {
    await store.setRedFlags({
      bladderBowel: true,
      saddleNumbness: false,
      progressiveWeakness: false,
      suddenSensoryLoss: false,
      painAfterTrauma: false,
      feverOrUnwell: false,
    });
    let data = await store.load();
    expect(data.redFlags.bladderBowel).toBe(true);
    expect(data.redFlagsCheckedAt).toBeTruthy();

    await store.clearRedFlags();
    data = await store.load();
    expect(data.redFlags.bladderBowel).toBe(false);
  });

  it('wipe removes everything', async () => {
    await store.addEntry(entry());
    await store.wipe();
    const data = await store.load();
    expect(data.entries).toHaveLength(0);
    expect(data.preferences.disclaimerAccepted).toBe(false);
  });
});

describe('LocalStorageStore fallback', () => {
  it('persists through localStorage when IndexedDB is unavailable', async () => {
    const store = new DataStore(new LocalStorageStore());
    await store.setPreferences({ ...DEFAULT_PREFERENCES, displayName: 'Тест' });
    expect(window.localStorage.length).toBeGreaterThan(0);
    const reloaded = await store.load();
    expect(reloaded.preferences.displayName).toBe('Тест');
    await store.wipe();
    expect(window.localStorage.length).toBe(0);
  });
});
