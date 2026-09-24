/**
 * Local-only persistence.
 *
 * There is no server, no analytics and no telemetry: everything the user
 * records stays in the browser (IndexedDB, or localStorage as a fallback when
 * IndexedDB is unavailable/blocked, e.g. some private-browsing modes).
 */

export type StorageKind = 'indexeddb' | 'localstorage' | 'memory';

export interface KeyValueStore {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  keys(): Promise<string[]>;
  clear(): Promise<void>;
  kind: StorageKind;
}

const DB_NAME = 'lumbar-rehab';
const DB_VERSION = 1;
const STORE_NAME = 'kv';

export class MemoryStore implements KeyValueStore {
  kind = 'memory' as const;
  private map = new Map<string, unknown>();

  async get<T>(key: string): Promise<T | undefined> {
    return this.map.has(key) ? (this.map.get(key) as T) : undefined;
  }
  async set<T>(key: string, value: T): Promise<void> {
    this.map.set(key, structuredCloneSafe(value));
  }
  async remove(key: string): Promise<void> {
    this.map.delete(key);
  }
  async keys(): Promise<string[]> {
    return [...this.map.keys()];
  }
  async clear(): Promise<void> {
    this.map.clear();
  }
}

export class LocalStorageStore implements KeyValueStore {
  kind = 'localstorage' as const;
  constructor(private readonly prefix = 'lumbar-rehab:') {}

  async get<T>(key: string): Promise<T | undefined> {
    const raw = window.localStorage.getItem(this.prefix + key);
    if (raw === null) return undefined;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return undefined;
    }
  }
  async set<T>(key: string, value: T): Promise<void> {
    window.localStorage.setItem(this.prefix + key, JSON.stringify(value));
  }
  async remove(key: string): Promise<void> {
    window.localStorage.removeItem(this.prefix + key);
  }
  async keys(): Promise<string[]> {
    const result: string[] = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (key?.startsWith(this.prefix)) result.push(key.slice(this.prefix.length));
    }
    return result;
  }
  async clear(): Promise<void> {
    const keys = await this.keys();
    for (const key of keys) window.localStorage.removeItem(this.prefix + key);
  }
}

export class IndexedDbStore implements KeyValueStore {
  kind = 'indexeddb' as const;
  private dbPromise: Promise<IDBDatabase>;

  constructor(dbName = DB_NAME) {
    this.dbPromise = openDatabase(dbName);
  }

  async get<T>(key: string): Promise<T | undefined> {
    const db = await this.dbPromise;
    return runRequest<T | undefined>(
      db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(key),
    );
  }

  async set<T>(key: string, value: T): Promise<void> {
    const db = await this.dbPromise;
    await runRequest(
      db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(value, key),
    );
  }

  async remove(key: string): Promise<void> {
    const db = await this.dbPromise;
    await runRequest(db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete(key));
  }

  async keys(): Promise<string[]> {
    const db = await this.dbPromise;
    const keys = await runRequest<IDBValidKey[]>(
      db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAllKeys(),
    );
    return keys.map((key) => String(key));
  }

  async clear(): Promise<void> {
    const db = await this.dbPromise;
    await runRequest(db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).clear());
  }
}

function openDatabase(dbName: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'));
    request.onblocked = () => reject(new Error('IndexedDB open blocked'));
  });
}

function runRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
  });
}

/**
 * Resolve the best available store for this browser. Never throws: if every
 * backend is blocked the app still runs, it just cannot persist.
 */
export async function createStore(): Promise<KeyValueStore> {
  if (typeof indexedDB !== 'undefined') {
    try {
      const store = new IndexedDbStore();
      await store.set('__probe__', 1);
      await store.remove('__probe__');
      return store;
    } catch {
      // fall through
    }
  }
  try {
    const probeKey = '__lumbar_probe__';
    window.localStorage.setItem(probeKey, '1');
    window.localStorage.removeItem(probeKey);
    return new LocalStorageStore();
  } catch {
    return new MemoryStore();
  }
}

function structuredCloneSafe<T>(value: T): T {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}
