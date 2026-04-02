import { describe, it, expect } from 'vitest';
import { BADGES, type BadgeStats } from './badges';

function earnedBadges(stats: BadgeStats): string[] {
  return BADGES.filter((b) => b.condition(stats)).map((b) => b.id);
}

function makeStats(overrides: Partial<BadgeStats> = {}): BadgeStats {
  return {
    totalWorkouts: 0,
    totalMinutes: 0,
    currentStreak: 0,
    maxStreak: 0,
    gymWorkouts: 0,
    circuitWorkouts: 0,
    ...overrides,
  };
}

describe('badges', () => {
  it('has exactly 10 badges defined', () => {
    expect(BADGES).toHaveLength(10);
  });

  describe('zero workouts / empty stats', () => {
    it('earns no badges', () => {
      expect(earnedBadges(makeStats())).toEqual([]);
    });
  });

  describe('first-workout (totalWorkouts >= 1)', () => {
    it('is not earned at 0 workouts', () => {
      expect(earnedBadges(makeStats({ totalWorkouts: 0 }))).not.toContain('first-workout');
    });

    it('is earned at exactly 1 workout', () => {
      expect(earnedBadges(makeStats({ totalWorkouts: 1 }))).toContain('first-workout');
    });
  });

  describe('ten-workouts (totalWorkouts >= 10)', () => {
    it('is not earned at 9 workouts', () => {
      expect(earnedBadges(makeStats({ totalWorkouts: 9 }))).not.toContain('ten-workouts');
    });

    it('is earned at exactly 10 workouts', () => {
      const badges = earnedBadges(makeStats({ totalWorkouts: 10 }));
      expect(badges).toContain('first-workout');
      expect(badges).toContain('ten-workouts');
    });
  });

  describe('twentyfive-workouts (totalWorkouts >= 25)', () => {
    it('is not earned at 24 workouts', () => {
      expect(earnedBadges(makeStats({ totalWorkouts: 24 }))).not.toContain('twentyfive-workouts');
    });

    it('is earned at exactly 25 workouts', () => {
      expect(earnedBadges(makeStats({ totalWorkouts: 25 }))).toContain('twentyfive-workouts');
    });
  });

  describe('fifty-workouts (totalWorkouts >= 50)', () => {
    it('is not earned at 49 workouts', () => {
      expect(earnedBadges(makeStats({ totalWorkouts: 49 }))).not.toContain('fifty-workouts');
    });

    it('is earned at exactly 50 workouts', () => {
      expect(earnedBadges(makeStats({ totalWorkouts: 50 }))).toContain('fifty-workouts');
    });
  });

  describe('hundred-workouts (totalWorkouts >= 100)', () => {
    it('is not earned at 99 workouts', () => {
      expect(earnedBadges(makeStats({ totalWorkouts: 99 }))).not.toContain('hundred-workouts');
    });

    it('is earned at exactly 100 workouts', () => {
      expect(earnedBadges(makeStats({ totalWorkouts: 100 }))).toContain('hundred-workouts');
    });
  });

  describe('twofifty-workouts (totalWorkouts >= 250)', () => {
    it('is not earned at 249 workouts', () => {
      expect(earnedBadges(makeStats({ totalWorkouts: 249 }))).not.toContain('twofifty-workouts');
    });

    it('is earned at exactly 250 workouts', () => {
      expect(earnedBadges(makeStats({ totalWorkouts: 250 }))).toContain('twofifty-workouts');
    });
  });

  describe('250 workouts earns all workout-count badges', () => {
    it('earns first, ten, twentyfive, fifty, hundred, and twofifty badges', () => {
      const badges = earnedBadges(makeStats({ totalWorkouts: 250 }));
      expect(badges).toContain('first-workout');
      expect(badges).toContain('ten-workouts');
      expect(badges).toContain('twentyfive-workouts');
      expect(badges).toContain('fifty-workouts');
      expect(badges).toContain('hundred-workouts');
      expect(badges).toContain('twofifty-workouts');
    });
  });

  describe('streak-7 (maxStreak >= 7)', () => {
    it('is not earned at 6-day streak', () => {
      expect(earnedBadges(makeStats({ maxStreak: 6 }))).not.toContain('streak-7');
    });

    it('is earned at exactly 7-day streak', () => {
      expect(earnedBadges(makeStats({ maxStreak: 7 }))).toContain('streak-7');
    });

    it('is earned but streak-30 is not at 7-day streak', () => {
      const badges = earnedBadges(makeStats({ maxStreak: 7 }));
      expect(badges).toContain('streak-7');
      expect(badges).not.toContain('streak-30');
    });
  });

  describe('streak-30 (maxStreak >= 30)', () => {
    it('is not earned at 29-day streak', () => {
      expect(earnedBadges(makeStats({ maxStreak: 29 }))).not.toContain('streak-30');
    });

    it('is earned at exactly 30-day streak', () => {
      const badges = earnedBadges(makeStats({ maxStreak: 30 }));
      expect(badges).toContain('streak-30');
      expect(badges).toContain('streak-7');
    });
  });

  describe('first-gym (gymWorkouts >= 1)', () => {
    it('is not earned at 0 gym workouts', () => {
      expect(earnedBadges(makeStats({ gymWorkouts: 0 }))).not.toContain('first-gym');
    });

    it('is earned at exactly 1 gym workout', () => {
      expect(earnedBadges(makeStats({ gymWorkouts: 1 }))).toContain('first-gym');
    });

    it('is earned at many gym workouts', () => {
      expect(earnedBadges(makeStats({ gymWorkouts: 50 }))).toContain('first-gym');
    });
  });

  describe('ten-hours (totalMinutes >= 600)', () => {
    it('is not earned at 599 minutes', () => {
      expect(earnedBadges(makeStats({ totalMinutes: 599 }))).not.toContain('ten-hours');
    });

    it('is earned at exactly 600 minutes', () => {
      expect(earnedBadges(makeStats({ totalMinutes: 600 }))).toContain('ten-hours');
    });

    it('is earned above 600 minutes', () => {
      expect(earnedBadges(makeStats({ totalMinutes: 1200 }))).toContain('ten-hours');
    });
  });

  describe('combined stats', () => {
    it('earns multiple badge categories simultaneously', () => {
      const badges = earnedBadges(
        makeStats({
          totalWorkouts: 100,
          totalMinutes: 700,
          maxStreak: 30,
          gymWorkouts: 5,
        }),
      );
      expect(badges).toContain('first-workout');
      expect(badges).toContain('hundred-workouts');
      expect(badges).toContain('streak-7');
      expect(badges).toContain('streak-30');
      expect(badges).toContain('first-gym');
      expect(badges).toContain('ten-hours');
    });
  });
});
