/**
 * Centralized query key factory for React Query.
 *
 * Usage:  queryKey: queryKeys.plans()
 *
 * NOTE: Consumers have NOT been migrated yet — this file is the single
 * source of truth that a follow-up refactor will wire in everywhere.
 */

export const queryKeys = {
  // ── Favorites / Votes ──────────────────────────────────
  favorites: () => ['favorites'] as const,
  votes: () => ['votes'] as const,

  // ── Exercise library ───────────────────────────────────
  exerciseLibrary: (filters?: Record<string, unknown>) =>
    filters ? (['exercise_library', filters] as const) : (['exercise_library'] as const),

  // ── Plans ──────────────────────────────────────────────
  plans: () => ['plans'] as const,
  plan: (planId: string) => ['plan', planId] as const,
  planDays: (planId: string) => ['plan_days', planId] as const,
  planExercises: (dayId: string) => ['plan_exercises', dayId] as const,
  publicPlans: () => ['public_plans'] as const,
  planVotes: () => ['plan_votes'] as const,

  // ── Sessions ───────────────────────────────────────────
  sessions: (filter?: string) =>
    filter ? (['sessions', filter] as const) : (['sessions'] as const),
  session: (sessionId: string) => ['session', sessionId] as const,
  sessionEntries: (sessionId: string) => ['session_entries', sessionId] as const,

  // ── Suggestions / history helpers ──────────────────────
  recentSessions: () => ['recent-sessions'] as const,
  plansWithDays: () => ['plans-with-days'] as const,
  planDayNames: () => ['plan-day-names'] as const,

  // ── Last weights ───────────────────────────────────────
  lastWeights: (exerciseNames: string[]) =>
    ['last_weights', ...exerciseNames.sort()] as const,

  // ── Mesocycle ──────────────────────────────────────────
  mesocycle: () => ['mesocycle'] as const,

  // ── Presets ────────────────────────────────────────────
  presets: () => ['presets'] as const,
} as const;
