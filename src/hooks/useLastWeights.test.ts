import { describe, it, expect, vi } from 'vitest';

vi.mock('../lib/supabase.ts', () => ({ supabase: {} }));
const { LastWeightLookup, normalizeExerciseName } = await import('./useLastWeights.ts');

describe('last weights lookup', () => {
  it('treats spelling variants as the same exercise', () => {
    expect(normalizeExerciseName('KH Bankdrücken')).toBe(normalizeExerciseName('KH-Bankdrücken'));
    expect(normalizeExerciseName('  Dead Bug ')).toBe(normalizeExerciseName('dead-bug'));
  });

  it('prefers the library id, so renamed exercises keep their history', () => {
    const lookup = new LastWeightLookup();
    lookup.add({ station_name: 'Old Name', library_exercise_id: 'lib-1', weight_kg: 20, reps: 10 });
    expect(lookup.get({ name: 'New Name', libraryExerciseId: 'lib-1' })).toEqual({ weight_kg: 20, reps: 10 });
  });

  it('falls back to the normalized name', () => {
    const lookup = new LastWeightLookup();
    lookup.add({ station_name: 'KH Bankdrücken', library_exercise_id: null, weight_kg: 16, reps: 12 });
    expect(lookup.get({ name: 'KH-Bankdrücken' })?.weight_kg).toBe(16);
    expect(lookup.get({ name: 'Kniebeugen' })).toBeUndefined();
  });
});
