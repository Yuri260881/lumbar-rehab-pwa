import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import type {
  AppData,
  DiaryEntry,
  InversionSession,
  Preferences,
  RedFlags,
  ScheduledReminder,
  WorkoutSession,
} from '../types';
import { hasRedFlags } from '../types';
import { DataStore } from '../lib/dataStore';
import { createStore } from '../lib/storage';
import { createDefaultData } from '../lib/defaults';
import {
  computeDueReminders,
  detectCapabilities,
  refreshPeriodicSync,
  requestPermission,
  showReminder,
} from '../lib/notifications';
import type { NotificationCapabilities } from '../lib/notifications';
import { toDateKey } from '../lib/dates';

export type LoadStatus = 'loading' | 'ready' | 'unavailable';

interface AppContextValue {
  data: AppData;
  status: LoadStatus;
  storageKind: string;
  capabilities: NotificationCapabilities;
  /** Reminders computed for today (always available, even without permissions). */
  dueReminders: ScheduledReminder[];
  /** Last reminders the browser could not deliver — shown in-app instead. */
  inAppAlerts: ScheduledReminder[];
  update: (mutator: (data: AppData) => AppData) => Promise<void>;
  setPreferences: (preferences: Preferences) => Promise<void>;
  addEntry: (entry: DiaryEntry) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  addSession: (session: WorkoutSession) => Promise<void>;
  addInversionSession: (session: InversionSession) => Promise<void>;
  setRedFlags: (flags: RedFlags) => Promise<void>;
  clearRedFlags: () => Promise<void>;
  wipeAllData: () => Promise<void>;
  askNotificationPermission: () => Promise<NotificationCapabilities>;
  markReminderDone: (id: string) => Promise<void>;
  snoozeReminder: (id: string, minutes: number) => Promise<void>;
  dismissAlert: (id: string) => void;
  registerServiceWorker: () => Promise<boolean>;
  serviceWorkerReady: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => createDefaultData());
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [storageKind, setStorageKind] = useState<string>('memory');
  const [capabilities, setCapabilities] = useState<NotificationCapabilities>(() =>
    detectCapabilities(),
  );
  const [dueReminders, setDueReminders] = useState<ScheduledReminder[]>([]);
  const [inAppAlerts, setInAppAlerts] = useState<ScheduledReminder[]>([]);
  const [serviceWorkerReady, setServiceWorkerReady] = useState(false);
  const storeRef = useRef<DataStore | null>(null);
  const dataRef = useRef<AppData>(data);
  dataRef.current = data;

  // ── Load once, then keep IndexedDB/localStorage in sync on every change ──
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const store = await createStore();
        const storeInstance = new DataStore(store);
        const loaded = await storeInstance.load();
        if (cancelled) return;
        storeRef.current = storeInstance;
        setStorageKind(store.kind);
        setData(loaded);
        setStatus('ready');
      } catch {
        if (cancelled) return;
        setStatus('unavailable');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const update = useCallback(async (mutator: (current: AppData) => AppData) => {
    const next = mutator(dataRef.current);
    setData(next);
    dataRef.current = next;
    if (storeRef.current) {
      try {
        await storeRef.current.save(next);
      } catch (error) {
        console.error('Failed to persist local data', error);
      }
    }
  }, []);

  const setPreferences = useCallback(
    async (preferences: Preferences) => update((current) => ({ ...current, preferences })),
    [update],
  );

  const addEntry = useCallback(
    async (entry: DiaryEntry) =>
      update((current) => {
        const entries = current.entries.filter((item) => item.id !== entry.id);
        return {
          ...current,
          entries: [entry, ...entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
        };
      }),
    [update],
  );

  const deleteEntry = useCallback(
    async (id: string) =>
      update((current) => ({
        ...current,
        entries: current.entries.filter((entry) => entry.id !== id),
      })),
    [update],
  );

  const addSession = useCallback(
    async (session: WorkoutSession) =>
      update((current) => ({ ...current, sessions: [session, ...current.sessions] })),
    [update],
  );

  const addInversionSession = useCallback(
    async (session: InversionSession) =>
      update((current) => ({
        ...current,
        inversionSessions: [
          ...current.inversionSessions.filter((item) => item.date !== session.date),
          session,
        ].sort((a, b) => a.date.localeCompare(b.date)),
      })),
    [update],
  );

  const setRedFlags = useCallback(
    async (redFlags: RedFlags) =>
      update((current) => ({ ...current, redFlags, redFlagsCheckedAt: new Date().toISOString() })),
    [update],
  );

  const clearRedFlags = useCallback(
    async () =>
      update((current) => ({
        ...current,
        redFlags: {
          bladderBowel: false,
          saddleNumbness: false,
          progressiveWeakness: false,
          suddenSensoryLoss: false,
          painAfterTrauma: false,
          feverOrUnwell: false,
        },
        redFlagsCheckedAt: new Date().toISOString(),
      })),
    [update],
  );

  const wipeAllData = useCallback(async () => {
    if (storeRef.current) await storeRef.current.wipe();
    const fresh = createDefaultData();
    setData(fresh);
    dataRef.current = fresh;
  }, []);

  const registerServiceWorker = useCallback(async () => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return false;
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      setServiceWorkerReady(Boolean(registration));
      const periodic = await refreshPeriodicSync();
      setCapabilities((current) => ({ ...current, periodicSyncSupported: periodic }));
      return Boolean(registration);
    } catch (error) {
      console.warn('Service worker registration failed', error);
      return false;
    }
  }, []);

  const askNotificationPermission = useCallback(async () => {
    const permission = await requestPermission();
    const next = { ...detectCapabilities(), permission };
    setCapabilities(next);
    return next;
  }, []);

  // ── Reminder scheduling ────────────────────────────────────────────────
  // Recomputed every minute while the app is open. This is deliberately an
  // in-app mechanism: browsers do not guarantee background delivery, so the
  // in-app list is the reliable path and notifications are a bonus.
  useEffect(() => {
    if (status !== 'ready') return;

    const recompute = () => {
      const prefs = dataRef.current.preferences;
      const reminders = computeDueReminders({
        workout: prefs.reminders.workout,
        inversion: prefs.reminders.inversion,
        inversionAnchorDate: dataRef.current.preferences.inversionAnchorDate,
        inversionDoctorApproved: prefs.inversionDoctorApproved,
        now: new Date(),
      });
      const filtered = reminders.filter((reminder) => {
        const settings =
          reminder.kind === 'workout' ? prefs.reminders.workout : prefs.reminders.inversion;
        if (settings.lastFiredOn && settings.lastFiredOn.slice(0, 10) === reminder.dueAt.slice(0, 10)) {
          return false;
        }
        if (settings.snoozedUntil && new Date(settings.snoozedUntil).getTime() > Date.now()) {
          return false;
        }
        return true;
      });
      setDueReminders(filtered);

      void (async () => {
        const now = Date.now();
        for (const reminder of filtered) {
          if (new Date(reminder.dueAt).getTime() > now) continue;
          const shown = await showReminder(reminder);
          if (!shown) {
            setInAppAlerts((current) =>
              current.some((item) => item.id === reminder.id) ? current : [...current, reminder],
            );
          }
          const stamp = new Date().toISOString();
          setData((current) => {
            const nextData: AppData = {
              ...current,
              preferences: {
                ...current.preferences,
                reminders: {
                  ...current.preferences.reminders,
                  [reminder.kind]: {
                    ...current.preferences.reminders[reminder.kind],
                    lastFiredOn: stamp,
                  },
                },
              },
            };
            dataRef.current = nextData;
            void storeRef.current?.save(nextData);
            return nextData;
          });
        }
      })();
    };

    recompute();
    const interval = window.setInterval(recompute, 30_000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') recompute();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [status, data.preferences.reminders, data.preferences.inversionAnchorDate, data.preferences.inversionDoctorApproved]);

  const markReminderDone = useCallback(
    async (id: string) => {
      const kind = id.startsWith('workout') ? 'workout' : 'inversion';
      setInAppAlerts((current) => current.filter((reminder) => reminder.id !== id));
      await update((current) => ({
        ...current,
        preferences: {
          ...current.preferences,
          reminders: {
            ...current.preferences.reminders,
            [kind]: {
              ...current.preferences.reminders[kind],
              lastFiredOn: new Date().toISOString(),
              snoozedUntil: undefined,
            },
          },
        },
      }));
    },
    [update],
  );

  const snoozeReminder = useCallback(
    async (id: string, minutes: number) => {
      const kind = id.startsWith('workout') ? 'workout' : 'inversion';
      const until = new Date(Date.now() + minutes * 60_000).toISOString();
      await update((current) => ({
        ...current,
        preferences: {
          ...current.preferences,
          reminders: {
            ...current.preferences.reminders,
            [kind]: {
              ...current.preferences.reminders[kind],
              snoozedUntil: until,
            },
          },
        },
      }));
    },
    [update],
  );

  const dismissAlert = useCallback((id: string) => {
    setInAppAlerts((current) => current.filter((reminder) => reminder.id !== id));
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      data,
      status,
      storageKind,
      capabilities,
      dueReminders,
      inAppAlerts,
      update,
      setPreferences,
      addEntry,
      deleteEntry,
      addSession,
      addInversionSession,
      setRedFlags,
      clearRedFlags,
      wipeAllData,
      askNotificationPermission,
      markReminderDone,
      snoozeReminder,
      dismissAlert,
      registerServiceWorker,
      serviceWorkerReady,
    }),
    [
      data,
      status,
      storageKind,
      capabilities,
      dueReminders,
      inAppAlerts,
      update,
      setPreferences,
      addEntry,
      deleteEntry,
      addSession,
      addInversionSession,
      setRedFlags,
      clearRedFlags,
      wipeAllData,
      askNotificationPermission,
      markReminderDone,
      snoozeReminder,
      dismissAlert,
      registerServiceWorker,
      serviceWorkerReady,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside <AppProvider>');
  return context;
}

/** Convenience selector: today's diary entry, if the user already wrote one. */
export function useTodayEntry(): DiaryEntry | undefined {
  const { data } = useApp();
  const key = toDateKey(new Date());
  return useMemo(() => data.entries.find((entry) => entry.date === key), [data.entries, key]);
}

/** True when the safety interlock should block exercise suggestions. */
export function useRedFlagLock(): boolean {
  const { data } = useApp();
  return hasRedFlags(data.redFlags);
}
