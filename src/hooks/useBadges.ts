import { useMemo, useCallback } from 'react';
import { useSessions } from './useSessions.ts';
import { BADGES, type BadgeStats } from '../lib/badges.ts';

const SEEN_KEY = 'ryng_seen_badges';

function getSeenBadges(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function markBadgesSeen(ids: string[]) {
  const seen = getSeenBadges();
  for (const id of ids) seen.add(id);
  localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
}

function computeMaxStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  const uniqueSorted = [...new Set(dates)].sort();
  let max = 1;
  let current = 1;

  for (let i = 1; i < uniqueSorted.length; i++) {
    const prev = new Date(uniqueSorted[i - 1]);
    const curr = new Date(uniqueSorted[i]);
    const diffMs = curr.getTime() - prev.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      current++;
      if (current > max) max = current;
    } else if (diffDays > 1) {
      current = 1;
    }
    // diffDays === 0 means same day, skip
  }

  return max;
}

function computeCurrentStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  const days = new Set(dates);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  const check = new Date(today);

  if (!days.has(check.toISOString().slice(0, 10))) {
    check.setDate(check.getDate() - 1);
    if (!days.has(check.toISOString().slice(0, 10))) {
      return 0;
    }
  }

  while (days.has(check.toISOString().slice(0, 10))) {
    streak++;
    check.setDate(check.getDate() - 1);
  }

  return streak;
}

export function useBadges() {
  const { data: sessions, isLoading } = useSessions('all');

  const stats: BadgeStats = useMemo(() => {
    if (!sessions || sessions.length === 0) {
      return {
        totalWorkouts: 0,
        totalMinutes: 0,
        currentStreak: 0,
        maxStreak: 0,
        gymWorkouts: 0,
        circuitWorkouts: 0,
      };
    }

    const totalWorkouts = sessions.length;
    const totalMinutes = Math.floor(
      sessions.reduce((sum, s) => sum + s.duration_sec, 0) / 60,
    );

    const dayStrings = sessions.map((s) =>
      new Date(s.started_at).toISOString().slice(0, 10),
    );

    const currentStreak = computeCurrentStreak(dayStrings);
    const maxStreak = computeMaxStreak(dayStrings);

    // gym vs circuit: sessions with plan_day_id are gym-linked
    const gymWorkouts = sessions.filter((s) => s.plan_day_id !== null).length;
    const circuitWorkouts = totalWorkouts - gymWorkouts;

    return {
      totalWorkouts,
      totalMinutes,
      currentStreak,
      maxStreak,
      gymWorkouts,
      circuitWorkouts,
    };
  }, [sessions]);

  const earned = useMemo(
    () => BADGES.filter((b) => b.condition(stats)),
    [stats],
  );

  const nextBadge = useMemo(
    () => BADGES.find((b) => !b.condition(stats)) ?? null,
    [stats],
  );

  const newBadges = useMemo(() => {
    const seen = getSeenBadges();
    return earned.filter((b) => !seen.has(b.id));
  }, [earned]);

  const markAllSeen = useCallback(() => {
    markBadgesSeen(earned.map((b) => b.id));
  }, [earned]);

  return { earned, nextBadge, newBadges, stats, isLoading, markAllSeen };
}
