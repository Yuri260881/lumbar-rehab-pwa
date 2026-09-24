import { describe, expect, it } from 'vitest';
import { escapeCsv, exportFilename, toCsv, toJson } from './exporters';
import { createDefaultData } from './defaults';
import type { AppData } from '../types';

function sample(): AppData {
  const data = createDefaultData();
  data.entries = [
    {
      id: 'e1',
      createdAt: '2026-09-24T08:00:00.000Z',
      date: '2026-09-24',
      pain: 5,
      numbness: true,
      weakness: false,
      sleepQuality: 4,
      exercises: ['pelvic-tilt', 'bird-dog'],
      delayedReaction: 'через 3 часа — легче',
      note: 'Заметка с "кавычками", запятой\nи переносом строки',
    },
  ];
  return data;
}

describe('exporters', () => {
  it('produces parseable JSON containing diary data', () => {
    const parsed = JSON.parse(toJson(sample())) as {
      entries: Array<{ pain: number }>;
      application: string;
    };
    expect(parsed.application).toBe('Lumbar Rehab Dashboard');
    expect(parsed.entries[0].pain).toBe(5);
  });

  it('quotes CSV cells that contain separators', () => {
    const csv = toCsv(sample());
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('date,createdAt,pain,numbness,weakness,sleepQuality,exercises,delayedReaction,note');
    expect(lines[1]).toContain('Наклон таза (pelvic tilt) | Бёрд-дог (диагональное вытяжение)');
    expect(lines[1]).toContain('"Заметка с ""кавычками"", запятой\nи переносом строки"');
  });

  it('escapes values predictably', () => {
    expect(escapeCsv('plain')).toBe('plain');
    expect(escapeCsv('a,b')).toBe('"a,b"');
    expect(escapeCsv('say "hi"')).toBe('"say ""hi"""');
  });

  it('names files with a date stamp', () => {
    expect(exportFilename('lumbar-rehab-diary', 'json')).toMatch(
      /^lumbar-rehab-diary-\d{4}-\d{2}-\d{2}\.json$/,
    );
  });
});
