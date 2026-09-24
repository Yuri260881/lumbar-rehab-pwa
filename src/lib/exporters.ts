import type { AppData } from '../types';
import { EXERCISES_BY_ID } from '../data/exercises';

/**
 * Export helpers. Everything happens client-side: the file is created as a Blob
 * and downloaded through a temporary object URL. Nothing is uploaded.
 */

export function toJson(data: AppData): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      application: 'Lumbar Rehab Dashboard',
      dataVersion: data.version,
      preferences: data.preferences,
      redFlags: data.redFlags,
      entries: data.entries,
      sessions: data.sessions,
      inversionSessions: data.inversionSessions,
    },
    null,
    2,
  );
}

const CSV_COLUMNS = [
  'date',
  'createdAt',
  'pain',
  'numbness',
  'weakness',
  'sleepQuality',
  'exercises',
  'delayedReaction',
  'note',
] as const;

export function toCsv(data: AppData): string {
  const rows = data.entries.map((entry) => [
    entry.date,
    entry.createdAt,
    entry.pain === null ? '' : String(entry.pain),
    entry.numbness ? 'yes' : 'no',
    entry.weakness ? 'yes' : 'no',
    entry.sleepQuality === null ? '' : String(entry.sleepQuality),
    entry.exercises.map((id) => EXERCISES_BY_ID[id]?.name ?? id).join(' | '),
    entry.delayedReaction,
    entry.note,
  ]);
  return [CSV_COLUMNS.join(','), ...rows.map((row) => row.map(escapeCsv).join(','))].join('\r\n');
}

export function escapeCsv(value: string): string {
  const needsQuotes = /[",\r\n]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

export function downloadFile(filename: string, contents: string, mimeType: string): void {
  const blob = new Blob([contents], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportFilename(prefix: string, extension: string): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `${prefix}-${stamp}.${extension}`;
}
