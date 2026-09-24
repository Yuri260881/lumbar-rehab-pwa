/** Local-timezone date helpers (YYYY-MM-DD keys), no external dependency. */

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayKey(now: Date = new Date()): string {
  return toDateKey(now);
}

export function parseDateKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Whole days between two local dates (b - a). */
export function daysBetween(a: string, b: string): number {
  const start = parseDateKey(a).getTime();
  const end = parseDateKey(b).getTime();
  return Math.round((end - start) / 86_400_000);
}

/**
 * Next scheduled slot for an "HH:MM" local time.
 * Returns a future timestamp; if today's slot already passed, returns tomorrow.
 */
export function nextOccurrence(hhmm: string, now: Date = new Date()): Date {
  const [hours, minutes] = parseTime(hhmm);
  const candidate = new Date(now);
  candidate.setHours(hours, minutes, 0, 0);
  if (candidate.getTime() <= now.getTime()) candidate.setDate(candidate.getDate() + 1);
  return candidate;
}

/**
 * Next every-N-days slot. `anchorKey` is a date on which a session is due.
 * If the anchor is in the future it is returned unchanged.
 */
export function nextEveryNDays(
  anchorKey: string,
  everyNDays: number,
  now: Date = new Date(),
): Date {
  const step = Math.max(1, Math.floor(everyNDays));
  const today = todayKey(now);
  let candidate = parseDateKey(anchorKey);
  if (daysBetween(anchorKey, today) < 0) return candidate;
  while (daysBetween(toDateKey(candidate), today) > 0) {
    candidate = addDays(candidate, step);
  }
  return candidate;
}

export function isDueEveryNDays(
  anchorKey: string,
  everyNDays: number,
  dateKey: string,
): boolean {
  const step = Math.max(1, Math.floor(everyNDays));
  const diff = daysBetween(anchorKey, dateKey);
  if (diff < 0) return false;
  return diff % step === 0;
}

export function parseTime(hhmm: string): [number, number] {
  const [rawHours, rawMinutes] = hhmm.split(':');
  const hours = Number.parseInt(rawHours ?? '8', 10);
  const minutes = Number.parseInt(rawMinutes ?? '0', 10);
  return [
    Number.isFinite(hours) ? Math.min(23, Math.max(0, hours)) : 8,
    Number.isFinite(minutes) ? Math.min(59, Math.max(0, minutes)) : 0,
  ];
}

export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

const WEEKDAYS_SHORT = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
const MONTHS_GEN = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
];

export function formatHumanDate(dateKey: string): string {
  const date = parseDateKey(dateKey);
  return `${date.getDate()} ${MONTHS_GEN[date.getMonth()]}`;
}

export function formatShortDate(dateKey: string): string {
  const date = parseDateKey(dateKey);
  return `${WEEKDAYS_SHORT[date.getDay()]} ${String(date.getDate()).padStart(2, '0')}.${String(
    date.getMonth() + 1,
  ).padStart(2, '0')}`;
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return `${formatHumanDate(toDateKey(date))}, ${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes(),
  ).padStart(2, '0')}`;
}

export function greetingForHour(hour: number): string {
  if (hour < 5) return 'Доброй ночи';
  if (hour < 12) return 'Доброе утро';
  if (hour < 18) return 'Добрый день';
  return 'Добрый вечер';
}

export function relativeDaysLabel(dateKey: string, now: Date = new Date()): string {
  const diff = daysBetween(todayKey(now), dateKey);
  if (diff === 0) return 'сегодня';
  if (diff === 1) return 'завтра';
  if (diff === -1) return 'вчера';
  if (diff > 1) return `через ${diff} дн.`;
  return `${Math.abs(diff)} дн. назад`;
}

export function createId(prefix: string): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}_${random}`;
}
