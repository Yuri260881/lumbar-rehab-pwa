import type {
  AppData,
  DiaryEntry,
  InversionSession,
  Preferences,
  RedFlags,
  WorkoutSession,
} from '../types';
import { NO_RED_FLAGS } from '../types';
import { createDefaultData, migrateData } from './defaults';
import type { KeyValueStore } from './storage';

const DATA_KEY = 'app-data';

/**
 * Thin repository over the local key/value store. The UI never touches
 * storage directly, which keeps every write auditable in one place.
 */
export class DataStore {
  constructor(private readonly store: KeyValueStore) {}

  get storageKind(): string {
    return this.store.kind;
  }

  async load(): Promise<AppData> {
    const raw = await this.store.get<unknown>(DATA_KEY);
    return migrateData(raw);
  }

  async save(data: AppData): Promise<void> {
    await this.store.set(DATA_KEY, data);
  }

  async update(mutator: (data: AppData) => AppData): Promise<AppData> {
    const current = await this.load();
    const next = mutator(current);
    await this.save(next);
    return next;
  }

  async setPreferences(preferences: Preferences): Promise<AppData> {
    return this.update((data) => ({ ...data, preferences }));
  }

  async addEntry(entry: DiaryEntry): Promise<AppData> {
    return this.update((data) => {
      const entries = data.entries.filter((item) => item.id !== entry.id);
      return { ...data, entries: [entry, ...entries].sort(byDateDesc) };
    });
  }

  async deleteEntry(id: string): Promise<AppData> {
    return this.update((data) => ({
      ...data,
      entries: data.entries.filter((entry) => entry.id !== id),
    }));
  }

  async addSession(session: WorkoutSession): Promise<AppData> {
    return this.update((data) => ({ ...data, sessions: [session, ...data.sessions] }));
  }

  async addInversionSession(session: InversionSession): Promise<AppData> {
    return this.update((data) => {
      const filtered = data.inversionSessions.filter((item) => item.date !== session.date);
      return { ...data, inversionSessions: [...filtered, session].sort(byDateAsc) };
    });
  }

  async setRedFlags(redFlags: RedFlags): Promise<AppData> {
    return this.update((data) => ({
      ...data,
      redFlags,
      redFlagsCheckedAt: new Date().toISOString(),
    }));
  }

  async clearRedFlags(): Promise<AppData> {
    return this.update((data) => ({
      ...data,
      redFlags: { ...NO_RED_FLAGS },
      redFlagsCheckedAt: new Date().toISOString(),
    }));
  }

  /** Full local wipe. Nothing is recoverable after this call. */
  async wipe(): Promise<void> {
    await this.store.clear();
  }
}

export function newDefaultData(): AppData {
  return createDefaultData();
}

function byDateDesc(a: DiaryEntry, b: DiaryEntry): number {
  return b.createdAt.localeCompare(a.createdAt);
}

function byDateAsc(a: InversionSession, b: InversionSession): number {
  return a.date.localeCompare(b.date);
}
