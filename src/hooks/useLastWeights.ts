import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.ts';
import { queryKeys } from '../lib/query-keys.ts';

export interface LastWeight {
  weight_kg: number;
  reps: number | null;
}

export function useLastWeights(exerciseNames: string[]) {
  return useQuery({
    queryKey: queryKeys.lastWeights(exerciseNames),
    enabled: exerciseNames.length > 0,
    staleTime: 1000 * 60 * 5,
    queryFn: async (): Promise<Map<string, LastWeight>> => {
      const { data, error } = await supabase.rpc('get_last_weights', {
        exercise_names: exerciseNames,
      });
      if (error) {
        // RPC might not exist yet — return empty map
        console.warn('get_last_weights RPC failed:', error.message);
        return new Map();
      }
      const map = new Map<string, LastWeight>();
      for (const row of data ?? []) {
        map.set(row.station_name, {
          weight_kg: Number(row.weight_kg),
          reps: row.reps != null ? Number(row.reps) : null,
        });
      }
      return map;
    },
  });
}
