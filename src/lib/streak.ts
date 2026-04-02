import type { Session } from '../types/session.ts';

/**
 * Calculate the current training streak (consecutive days with sessions).
 * Counts backwards from today (or yesterday if no session today).
 */
export function calculateStreak(sessions: Session[]): number {
  if (sessions.length === 0) return 0;

  // Get unique training days (YYYY-MM-DD)
  const days = new Set(
    sessions.map((s) => new Date(s.started_at).toISOString().slice(0, 10)),
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  const check = new Date(today);

  // Check today first
  if (!days.has(check.toISOString().slice(0, 10))) {
    // If no session today, check if yesterday counts
    check.setDate(check.getDate() - 1);
    if (!days.has(check.toISOString().slice(0, 10))) {
      return 0;
    }
  }

  // Count consecutive days backwards
  while (days.has(check.toISOString().slice(0, 10))) {
    streak++;
    check.setDate(check.getDate() - 1);
  }

  return streak;
}
