import { describe, expect, it } from 'vitest';
import {
  computeDueReminders,
  inversionDayStatus,
  nextInversionDate,
  shiftAnchor,
} from './notifications';

const baseOptions = {
  workout: { enabled: true, time: '08:00' },
  inversion: { enabled: true, time: '09:00', everyNDays: 2 },
  inversionAnchorDate: '2026-09-24',
  inversionDoctorApproved: true,
};

describe('computeDueReminders', () => {
  it('schedules both reminders on a session day', () => {
    const reminders = computeDueReminders({ ...baseOptions, now: new Date(2026, 8, 24, 6, 0) });
    expect(reminders.map((reminder) => reminder.kind).sort()).toEqual(['inversion', 'workout']);
  });

  it('skips the inversion reminder on a rest day', () => {
    const reminders = computeDueReminders({ ...baseOptions, now: new Date(2026, 8, 25, 6, 0) });
    expect(reminders).toHaveLength(1);
    expect(reminders[0].kind).toBe('workout');
  });

  it('never schedules inversion without explicit doctor approval', () => {
    const reminders = computeDueReminders({
      ...baseOptions,
      inversionDoctorApproved: false,
      now: new Date(2026, 8, 24, 6, 0),
    });
    expect(reminders.map((reminder) => reminder.kind)).toEqual(['workout']);
  });

  it('stays silent when reminders are disabled', () => {
    const reminders = computeDueReminders({
      ...baseOptions,
      workout: { enabled: false, time: '08:00' },
      inversion: { enabled: false, time: '09:00', everyNDays: 2 },
      now: new Date(2026, 8, 24, 6, 0),
    });
    expect(reminders).toHaveLength(0);
  });

  it('produces stable ids per day so repeats are de-duplicated', () => {
    const first = computeDueReminders({ ...baseOptions, now: new Date(2026, 8, 24, 6, 0) });
    const second = computeDueReminders({ ...baseOptions, now: new Date(2026, 8, 24, 7, 30) });
    expect(first.map((r) => r.id)).toEqual(second.map((r) => r.id));
  });
});

describe('inversion calendar', () => {
  it('classifies session, rest and pre-start days', () => {
    expect(inversionDayStatus('2026-09-24', 2, '2026-09-24')).toBe('session');
    expect(inversionDayStatus('2026-09-24', 2, '2026-09-25')).toBe('rest');
    expect(inversionDayStatus('2026-09-24', 2, '2026-09-20')).toBe('before-start');
    expect(inversionDayStatus(null, 2, '2026-09-24')).toBe('rest');
  });

  it('computes the next session date', () => {
    const next = nextInversionDate({
      anchorDate: '2026-09-24',
      everyNDays: 2,
      now: new Date(2026, 8, 25),
    });
    expect(next?.toDateString()).toBe(new Date(2026, 8, 26).toDateString());
    expect(nextInversionDate({ anchorDate: null, everyNDays: 2 })).toBeNull();
  });

  it('shifts the anchor when the user skips or adds a day', () => {
    expect(shiftAnchor('2026-09-24', 2)).toBe('2026-09-26');
    expect(shiftAnchor('2026-09-24', -1)).toBe('2026-09-23');
    expect(shiftAnchor(null, 1, new Date(2026, 8, 24))).toBe('2026-09-24');
  });
});
