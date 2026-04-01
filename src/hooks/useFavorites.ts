import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.ts';
import { queryKeys } from '../lib/query-keys.ts';

export function useFavorites() {
  return useQuery({
    queryKey: queryKeys.favorites(),
    staleTime: 1000 * 60 * 10, // 10 min — rarely changes externally
    queryFn: async (): Promise<Set<string>> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return new Set();
      const { data, error } = await supabase
        .from('exercise_favorites')
        .select('exercise_id')
        .eq('user_id', user.id);
      if (error) throw error;
      return new Set(data.map((f: { exercise_id: string }) => f.exercise_id));
    },
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ exerciseId, isFavorite }: { exerciseId: string; isFavorite: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (isFavorite) {
        await supabase.from('exercise_favorites').delete()
          .eq('user_id', user.id)
          .eq('exercise_id', exerciseId);
      } else {
        await supabase.from('exercise_favorites').insert({
          user_id: user.id,
          exercise_id: exerciseId,
        });
      }
      return { exerciseId, isFavorite };
    },
    // Optimistic update — instant UI feedback
    onMutate: async ({ exerciseId, isFavorite }) => {
      await qc.cancelQueries({ queryKey: queryKeys.favorites() });
      const previous = qc.getQueryData<Set<string>>(queryKeys.favorites());

      qc.setQueryData<Set<string>>(queryKeys.favorites(), (old) => {
        const next = new Set(old);
        if (isFavorite) {
          next.delete(exerciseId);
        } else {
          next.add(exerciseId);
        }
        return next;
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      // Rollback on error
      if (context?.previous) {
        qc.setQueryData(queryKeys.favorites(), context.previous);
      }
    },
    onSettled: () => {
      // Refetch in background to ensure consistency
      qc.invalidateQueries({ queryKey: queryKeys.favorites() });
    },
  });
}
