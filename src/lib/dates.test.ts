import { describe, expect, it } from 'vitest';
import {
  addDays,
  daysBetween,
  formatClock,
  isDueEveryNDays,
  nextEveryNDays,
  nextOccurrence,
  parseTime,
} from './dates';
import { DAILY_TIPS, tipForDate } from '../data/content';

describe('date helpers', () => {
  it('computes whole days between local dates', () => {
    expect(daysBetween('2026-09-20', '2026-09-24')).toBe(4);
    expect(daysBetween('2026-09-24', '2026-09-20')).toBe(-4);
    expect(daysBetween('2026-09-24', '2026-09-24')).toBe(0);
  });

  it('adds days across month boundaries', () => {
    expect(addDays(new Date(2026, 8, 30), 3).toDateString()).toBe(
      new Date(2026, 9, 3).toDateString(),
    );
  });

  it('parses HH:MM defensively', () => {
    expect(parseTime('08:30')).toEqual([8, 30]);
    expect(parseTime('99:99')).toEqual([23, 59]);
    expect(parseTime('broken')).toEqual([8, 0]);
  });

  it('returns tomorrow when today\'s slot already passed', () => {
    const now = new Date(2026, 8, 24, 18, 0, 0);
    const next = nextOccurrence('08:00', now);
    expect(next.toDateString()).toBe(new Date(2026, 8, 25).toDateString());
    expect(next.getHours()).toBe(8);
  });

  it('keeps today when the slot is still ahead', () => {
    const now = new Date(2026, 8, 24, 6, 0, 0);
    const next = nextOccurrence('08:00', now);
    expect(next.toDateString()).toBe(now.toDateString());
  });
});

describe('every-N-days cadence (inversion table)', () => {
  it('marks every second day as a session day', () => {
    expect(isDueEveryNDays('2026-09-24', 2, '2026-09-24')).toBe(true);
    expect(isDueEveryNDays('2026-09-24', 2, '2026-09-25')).toBe(false);
    expect(isDueEveryNDays('2026-09-24', 2, '2026-09-26')).toBe(true);
  });

  it('never schedules before the anchor date', () => {
    expect(isDueEveryNDays('2026-09-30', 2, '2026-09-24')).toBe(false);
  });

  it('rolls forward to the next due day', () => {
    const now = new Date(2026, 8, 27);
    const next = nextEveryNDays('2026-09-24', 2, now);
    expect(next.toDateString()).toBe(new Date(2026, 8, 28).toDateString());
  });

  it('returns the anchor itself when it is still in the future', () => {
    const next = nextEveryNDays('2026-10-01', 2, new Date(2026, 8, 24));
    expect(next.toDateString()).toBe(new Date(2026, 9, 1).toDateString());
  });

  it('treats a zero or negative cadence as daily', () => {
    expect(isDueEveryNDays('2026-09-24', 0, '2026-09-25')).toBe(true);
  });
});

describe('formatClock', () => {
  it('formats mm:ss and never goes negative', () => {
    expect(formatClock(0)).toBe('00:00');
    expect(formatClock(65)).toBe('01:05');
    expect(formatClock(-5)).toBe('00:00');
  });
});

describe('tipForDate', () => {
  it('is stable for a date and always returns a known tip', () => {
    const first = tipForDate('2026-09-24');
    expect(tipForDate('2026-09-24')).toBe(first);
    expect(DAILY_TIPS).toContain(first);
  });
});
