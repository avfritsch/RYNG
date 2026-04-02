import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { calculateStreak } from './streak';
import type { Session } from '../types/session';

/** Helper: create a minimal Session with only started_at populated. */
function makeSession(dateStr: string): Session {
  return {
    id: crypto.randomUUID(),
    user_id: 'u1',
    started_at: dateStr,
    finished_at: dateStr,
    duration_sec: 1800,
    rounds: 3,
    station_count: 6,
    plan_day_id: null,
    mesocycle_week: null,
    created_at: dateStr,
  };
}

/**
 * The streak code derives "today" as:
 *   const today = new Date(); today.setHours(0,0,0,0);
 * then compares via today.toISOString().slice(0,10).
 *
 * This helper computes that same anchor date string, then builds a session
 * timestamp N days before it (using the UTC date string directly).
 */
function sessionOnDay(n: number): string {
  // Replicate the code's "today" anchor
  const anchor = new Date();
  anchor.setHours(0, 0, 0, 0);
  // Go back n days
  anchor.setDate(anchor.getDate() - n);
  // The UTC date of this anchor is what the code will check.
  // Build a timestamp on that same UTC date at 12:00 UTC.
  const dateStr = anchor.toISOString().slice(0, 10);
  return `${dateStr}T12:00:00.000Z`;
}

describe('calculateStreak', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns 0 for an empty sessions array', () => {
    expect(calculateStreak([])).toBe(0);
  });

  it('returns 1 for a single session today', () => {
    const sessions = [makeSession(sessionOnDay(0))];
    expect(calculateStreak(sessions)).toBe(1);
  });

  it('returns correct count for consecutive days ending today', () => {
    const sessions = [
      makeSession(sessionOnDay(0)),
      makeSession(sessionOnDay(1)),
      makeSession(sessionOnDay(2)),
    ];
    expect(calculateStreak(sessions)).toBe(3);
  });

  it('returns correct count for 5 consecutive days', () => {
    const sessions = Array.from({ length: 5 }, (_, i) => makeSession(sessionOnDay(i)));
    expect(calculateStreak(sessions)).toBe(5);
  });

  it('breaks streak when there is a gap', () => {
    const sessions = [
      makeSession(sessionOnDay(0)),
      makeSession(sessionOnDay(1)),
      makeSession(sessionOnDay(2)),
      // gap at day 3
      makeSession(sessionOnDay(4)),
      makeSession(sessionOnDay(5)),
    ];
    expect(calculateStreak(sessions)).toBe(3);
  });

  it('counts multiple sessions on the same day as 1 day', () => {
    // Two sessions on the same UTC date as "today"
    const anchor = new Date();
    anchor.setHours(0, 0, 0, 0);
    const dateStr = anchor.toISOString().slice(0, 10);

    const sessions = [
      makeSession(`${dateStr}T08:00:00.000Z`),
      makeSession(`${dateStr}T18:00:00.000Z`),
      makeSession(sessionOnDay(1)),
    ];
    expect(calculateStreak(sessions)).toBe(2);
  });

  it('counts streak starting from yesterday when no session today', () => {
    const sessions = [
      makeSession(sessionOnDay(1)),
      makeSession(sessionOnDay(2)),
      makeSession(sessionOnDay(3)),
    ];
    expect(calculateStreak(sessions)).toBe(3);
  });

  it('returns 1 when only yesterday has a session', () => {
    const sessions = [makeSession(sessionOnDay(1))];
    expect(calculateStreak(sessions)).toBe(1);
  });

  it('returns 0 when most recent session is 2+ days ago', () => {
    const sessions = [
      makeSession(sessionOnDay(3)),
      makeSession(sessionOnDay(4)),
    ];
    expect(calculateStreak(sessions)).toBe(0);
  });

  it('returns 0 for old sessions with no recent ones', () => {
    const sessions = [
      makeSession(sessionOnDay(30)),
      makeSession(sessionOnDay(31)),
      makeSession(sessionOnDay(32)),
    ];
    expect(calculateStreak(sessions)).toBe(0);
  });

  it('handles a long streak of 30 consecutive days', () => {
    const sessions = Array.from({ length: 30 }, (_, i) => makeSession(sessionOnDay(i)));
    expect(calculateStreak(sessions)).toBe(30);
  });

  it('handles sessions in non-chronological order', () => {
    const sessions = [
      makeSession(sessionOnDay(2)),
      makeSession(sessionOnDay(0)),
      makeSession(sessionOnDay(1)),
    ];
    expect(calculateStreak(sessions)).toBe(3);
  });

  it('handles sessions spanning midnight boundary', () => {
    // "yesterday" per the code's logic, and "today"
    const anchor = new Date();
    anchor.setHours(0, 0, 0, 0);
    const todayDate = anchor.toISOString().slice(0, 10);
    anchor.setDate(anchor.getDate() - 1);
    const yesterdayDate = anchor.toISOString().slice(0, 10);

    const sessions = [
      makeSession(`${todayDate}T23:50:00.000Z`),
      makeSession(`${yesterdayDate}T00:10:00.000Z`),
    ];
    expect(calculateStreak(sessions)).toBe(2);
  });
});
