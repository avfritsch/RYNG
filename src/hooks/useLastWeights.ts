import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.ts';
import { queryKeys } from '../lib/query-keys.ts';
import { logger } from '../lib/logger.ts';

export interface LastWeight {
  weight_kg: number;
  reps: number | null;
}

export interface WeightedExercise {
  name: string;
  libraryExerciseId?: string;
}

/** Same rule as the SQL normalize_exercise_name(): spelling variants match. */
export function normalizeExerciseName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9äöüß]+/g, '');
}

/** Looks up the last weight by library id first, then by normalized name. */
export class LastWeightLookup {
  private byId = new Map<string, LastWeight>();
  private byName = new Map<string, LastWeight>();

  add(row: { station_name: string; library_exercise_id: string | null } & LastWeight) {
    const value = { weight_kg: row.weight_kg, reps: row.reps };
    if (row.library_exercise_id && !this.byId.has(row.library_exercise_id)) this.byId.set(row.library_exercise_id, value);
    const key = normalizeExerciseName(row.station_name);
    if (!this.byName.has(key)) this.byName.set(key, value);
  }

  get(ex: WeightedExercise): LastWeight | undefined {
    return (ex.libraryExerciseId && this.byId.get(ex.libraryExerciseId)) || this.byName.get(normalizeExerciseName(ex.name));
  }
}

export function useLastWeights(exercises: WeightedExercise[]) {
  const names = exercises.map((e) => e.name);
  const ids = exercises.map((e) => e.libraryExerciseId).filter((id): id is string => !!id);
  return useQuery({
    queryKey: queryKeys.lastWeights([...names, ...ids]),
    enabled: exercises.length > 0,
    staleTime: 1000 * 60 * 5,
    queryFn: async (): Promise<LastWeightLookup> => {
      const lookup = new LastWeightLookup();
      const { data, error } = await supabase.rpc('get_last_weights', {
        exercise_names: names,
        exercise_ids: ids,
      });
      if (error) {
        logger.warn('get_last_weights RPC failed', { error: error.message });
        return lookup;
      }
      for (const row of data ?? []) {
        lookup.add({
          station_name: row.station_name,
          library_exercise_id: row.library_exercise_id ?? null,
          weight_kg: Number(row.weight_kg),
          reps: row.reps != null ? Number(row.reps) : null,
        });
      }
      return lookup;
    },
  });
}
