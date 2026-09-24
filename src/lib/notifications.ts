import type { ScheduledReminder } from '../types';
import {
  addDays,
  daysBetween,
  isDueEveryNDays,
  nextEveryNDays,
  nextOccurrence,
  toDateKey,
  todayKey,
} from './dates';

export interface NotificationCapabilities {
  apiSupported: boolean;
  permission: NotificationPermission | 'unsupported';
  secureContext: boolean;
  serviceWorkerSupported: boolean;
  /** Chrome/Edge/Android-only experimental scheduling API. */
  notificationTriggersSupported: boolean;
  periodicSyncSupported: boolean;
  /** True when the app is running as an installed PWA (needed on iOS). */
  installedStandalone: boolean;
}

export function detectCapabilities(): NotificationCapabilities {
  if (typeof window === 'undefined') {
    return {
      apiSupported: false,
      permission: 'unsupported',
      secureContext: false,
      serviceWorkerSupported: false,
      notificationTriggersSupported: false,
      periodicSyncSupported: false,
      installedStandalone: false,
    };
  }
  const apiSupported = typeof window.Notification === 'function';
  const registration = window.navigator?.serviceWorker;
  return {
    apiSupported,
    permission: apiSupported ? window.Notification.permission : 'unsupported',
    secureContext: window.isSecureContext === true,
    serviceWorkerSupported: Boolean(registration),
    notificationTriggersSupported: Boolean(
      registration &&
        typeof (
          registration as ServiceWorkerContainer & {
            showNotification?: (title: string, options?: { showTrigger?: unknown }) => unknown;
          }
        ).showNotification === 'function' &&
          typeof window !== 'undefined' &&
          'NotificationTrigger' in window,
    ),
    // Periodic Background Sync is a property of the *registration*, which is
    // only available asynchronously; `refreshPeriodicSync()` fills this in.
    periodicSyncSupported: false,
    installedStandalone:
      window.matchMedia?.('(display-mode: standalone)').matches === true ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true,
  };
}

export async function requestPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || typeof window.Notification !== 'function') {
    return 'unsupported';
  }
  try {
    return await window.Notification.requestPermission();
  } catch {
    return window.Notification.permission;
  }
}

/**
 * Show a reminder through the Service Worker when possible (so it also works
 * while the tab is in the background), falling back to the plain Notification
 * constructor, and finally to a silent in-app return value.
 *
 * Returns true when something was actually shown to the user.
 */
export async function showReminder(reminder: ScheduledReminder): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const options: NotificationOptions = {
    body: reminder.body,
    tag: reminder.id,
    lang: 'ru',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
  };
  if (window.Notification?.permission !== 'granted') return false;
  try {
    const registration = await window.navigator.serviceWorker?.getRegistration();
    if (registration) {
      await registration.showNotification(reminder.title, options);
      return true;
    }
  } catch {
    /* fall through to the constructor */
  }
  try {
    new window.Notification(reminder.title, options);
    return true;
  } catch {
    return false;
  }
}

/**
 * Register Periodic Background Sync if the browser supports it (Chrome/Edge on
 * Android and desktop, for installed PWAs with sufficient engagement).
 * Returns false everywhere else — the app never depends on it.
 */
export async function refreshPeriodicSync(): Promise<boolean> {
  try {
    const registration = await window.navigator.serviceWorker?.getRegistration();
    const sync = (registration as (ServiceWorkerRegistration & { periodicSync?: unknown }) | undefined)
      ?.periodicSync as { register: (tag: string, options: { minInterval: number }) => Promise<void> } | undefined;
    if (!sync) return false;
    await sync.register('reminders', { minInterval: 12 * 60 * 60 * 1000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Compute which reminders are due for the given date.
 *
 * Pure function: easy to test, no timers involved.
 */
export function computeDueReminders(options: {
  workout: { enabled: boolean; time: string };
  inversion: { enabled: boolean; time: string; everyNDays: number };
  inversionAnchorDate: string | null;
  inversionDoctorApproved: boolean;
  now: Date;
}): ScheduledReminder[] {
  const { workout, inversion, inversionAnchorDate, inversionDoctorApproved, now } = options;
  const dateKey = toDateKey(now);
  const reminders: ScheduledReminder[] = [];

  if (workout.enabled) {
    const dueAt = buildAt(workout.time, now);
    reminders.push({
      id: `workout-${dateKey}`,
      kind: 'workout',
      title: 'Время тренировки',
      body: 'Пора выполнить сегодняшнюю программу. Начните с разминки и остановитесь, если боль усиливается.',
      dueAt: dueAt.toISOString(),
      fired: false,
    });
  }

  // The inversion reminder is only scheduled when the user has confirmed a
  // doctor approved using the table. Otherwise the app stays silent about it.
  if (inversion.enabled && inversionDoctorApproved && inversionAnchorDate) {
    if (isDueEveryNDays(inversionAnchorDate, inversion.everyNDays, dateKey)) {
      const dueAt = buildAt(inversion.time, now);
      reminders.push({
        id: `inversion-${dateKey}`,
        kind: 'inversion',
        title: 'Инверсионный стол: день сеанса',
        body: 'Сегодня день сеанса по вашей схеме через день. Пройдите чек-лист безопасности перед использованием.',
        dueAt: dueAt.toISOString(),
        fired: false,
      });
    }
  }

  return reminders;
}

export function nextWorkoutReminderAt(time: string, now: Date = new Date()): Date {
  return nextOccurrence(time, now);
}

export function nextInversionDate(options: {
  anchorDate: string | null;
  everyNDays: number;
  now?: Date;
}): Date | null {
  const { anchorDate, everyNDays, now = new Date() } = options;
  if (!anchorDate) return null;
  return nextEveryNDays(anchorDate, everyNDays, now);
}

/** Calendar of upcoming/current inversion days for the month grid. */
export function inversionDayStatus(
  anchorDate: string | null,
  everyNDays: number,
  dateKey: string,
): 'session' | 'rest' | 'before-start' {
  if (!anchorDate) return 'rest';
  const diff = daysBetween(anchorDate, dateKey);
  if (diff < 0) return 'before-start';
  return diff % Math.max(1, everyNDays) === 0 ? 'session' : 'rest';
}

export function shiftAnchor(anchorDate: string | null, days: number, now: Date = new Date()): string {
  if (!anchorDate) return todayKey(now);
  return toDateKey(addDays(new Date(anchorDate), days));
}

function buildAt(hhmm: string, now: Date): Date {
  const slot = nextOccurrence(hhmm, new Date(now.getTime() - 1));
  const [hours, minutes] = hhmm.split(':').map((part) => Number.parseInt(part, 10));
  const sameDay = new Date(now);
  sameDay.setHours(hours || 0, minutes || 0, 0, 0);
  return slot.getDate() === sameDay.getDate() &&
    slot.getMonth() === sameDay.getMonth() &&
    slot.getTime() >= now.getTime()
    ? sameDay
    : slot;
}

/** Human-readable description of notification support on this device. */
export function describePlatformLimits(): string[] {
  if (typeof window === 'undefined') return [];
  const ua = window.navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/.test(ua);
  const isAndroid = /Android/.test(ua);
  const isFirefox = /Firefox\//.test(ua);

  if (isIOS) {
    return [
      'iOS/iPadOS: веб-уведомления работают только если приложение добавлено на главный экран через Safari (iOS 16.4 и новее) и разрешение выдано после установки.',
      'В обычном браузере iOS уведомления не показываются — используйте напоминания внутри приложения.',
      'Даже установленное PWA не получает уведомления, если устройство долго не открывало приложение.',
    ];
  }
  if (isAndroid) {
    return [
      'Android (Chrome): уведомления работают, но могут задерживаться из-за энергосбережения системы или ограничения фоновой активности приложения.',
      'Если уведомления не приходят, проверьте настройки батареи и разрешения для браузера.',
    ];
  }
  if (isFirefox) {
    return [
      'Firefox: поддержка веб-уведомлений ограничена — планирование в фоне недоступно. Используйте напоминания внутри приложения.',
    ];
  }
  return [
    'Настольные браузеры показывают уведомления, только когда приложение открыто в активной вкладке или установлено как PWA.',
    'Ни один браузер не гарантирует доставку уведомления при полностью закрытом приложении — поэтому внутри приложения всегда есть резервный список напоминаний.',
  ];
}
