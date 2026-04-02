import { describe, expect, it } from 'vitest';
import { queryKeys } from './query-keys';

describe('queryKeys', () => {
  describe('favorites', () => {
    it('returns ["favorites"]', () => {
      expect(queryKeys.favorites()).toEqual(['favorites']);
    });
  });

  describe('votes', () => {
    it('returns ["votes"]', () => {
      expect(queryKeys.votes()).toEqual(['votes']);
    });
  });

  describe('exerciseLibrary', () => {
    it('returns ["exercise_library"] when called without filters', () => {
      expect(queryKeys.exerciseLibrary()).toEqual(['exercise_library']);
    });

    it('returns ["exercise_library", filters] when called with filters', () => {
      expect(queryKeys.exerciseLibrary({ search: 'test' })).toEqual([
        'exercise_library',
        { search: 'test' },
      ]);
    });
  });

  describe('plans', () => {
    it('returns ["plans"]', () => {
      expect(queryKeys.plans()).toEqual(['plans']);
    });
  });

  describe('plan', () => {
    it('returns ["plan", planId]', () => {
      expect(queryKeys.plan('abc')).toEqual(['plan', 'abc']);
    });
  });

  describe('planDays', () => {
    it('returns ["plan_days", planId]', () => {
      expect(queryKeys.planDays('abc')).toEqual(['plan_days', 'abc']);
    });
  });

  describe('planExercises', () => {
    it('returns ["plan_exercises", dayId]', () => {
      expect(queryKeys.planExercises('abc')).toEqual(['plan_exercises', 'abc']);
    });
  });

  describe('publicPlans', () => {
    it('returns ["public_plans"]', () => {
      expect(queryKeys.publicPlans()).toEqual(['public_plans']);
    });
  });

  describe('planVotes', () => {
    it('returns ["plan_votes"]', () => {
      expect(queryKeys.planVotes()).toEqual(['plan_votes']);
    });
  });

  describe('sessions', () => {
    it('returns ["sessions"] when called without filter', () => {
      expect(queryKeys.sessions()).toEqual(['sessions']);
    });

    it('returns ["sessions", filter] when called with filter', () => {
      expect(queryKeys.sessions('week')).toEqual(['sessions', 'week']);
    });
  });

  describe('session', () => {
    it('returns ["session", sessionId]', () => {
      expect(queryKeys.session('id1')).toEqual(['session', 'id1']);
    });
  });

  describe('sessionEntries', () => {
    it('returns ["session_entries", sessionId]', () => {
      expect(queryKeys.sessionEntries('id1')).toEqual(['session_entries', 'id1']);
    });
  });

  describe('recentSessions', () => {
    it('returns ["recent-sessions"]', () => {
      expect(queryKeys.recentSessions()).toEqual(['recent-sessions']);
    });
  });

  describe('plansWithDays', () => {
    it('returns ["plans-with-days"]', () => {
      expect(queryKeys.plansWithDays()).toEqual(['plans-with-days']);
    });
  });

  describe('planDayNames', () => {
    it('returns ["plan-day-names"]', () => {
      expect(queryKeys.planDayNames()).toEqual(['plan-day-names']);
    });
  });

  describe('lastWeights', () => {
    it('returns ["last_weights", ...sortedNames]', () => {
      expect(queryKeys.lastWeights(['a', 'b'])).toEqual(['last_weights', 'a', 'b']);
    });

    it('sorts exercise names alphabetically', () => {
      expect(queryKeys.lastWeights(['b', 'a'])).toEqual(['last_weights', 'a', 'b']);
    });

    it('handles empty array', () => {
      expect(queryKeys.lastWeights([])).toEqual(['last_weights']);
    });
  });

  describe('mesocycle', () => {
    it('returns ["mesocycle"]', () => {
      expect(queryKeys.mesocycle()).toEqual(['mesocycle']);
    });
  });

  describe('notificationPrefs', () => {
    it('returns ["notification_prefs"]', () => {
      expect(queryKeys.notificationPrefs()).toEqual(['notification_prefs']);
    });
  });

  describe('presets', () => {
    it('returns ["presets"]', () => {
      expect(queryKeys.presets()).toEqual(['presets']);
    });
  });
});
