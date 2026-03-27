import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.ts';

export function useVotes() {
  return useQuery({
    queryKey: ['votes'],
    staleTime: 1000 * 60 * 10,
    queryFn: async (): Promise<Set<string>> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return new Set();
      const { data, error } = await supabase
        .from('exercise_votes')
        .select('exercise_id')
        .eq('user_id', user.id);
      if (error) throw error;
      return new Set(data.map((v: { exercise_id: string }) => v.exercise_id));
    },
  });
}

export function useToggleVote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ exerciseId, hasVoted }: { exerciseId: string; hasVoted: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (hasVoted) {
        await supabase.from('exercise_votes').delete()
          .eq('user_id', user.id).eq('exercise_id', exerciseId);
      } else {
        await supabase.from('exercise_votes').insert({
          user_id: user.id, exercise_id: exerciseId,
        });
      }
      return { exerciseId, hasVoted };
    },
    onMutate: async ({ exerciseId, hasVoted }) => {
      await qc.cancelQueries({ queryKey: ['votes'] });
      const previous = qc.getQueryData<Set<string>>(['votes']);
      qc.setQueryData<Set<string>>(['votes'], (old) => {
        const next = new Set(old);
        if (hasVoted) { next.delete(exerciseId); } else { next.add(exerciseId); }
        return next;
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(['votes'], context.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['votes'] });
      qc.invalidateQueries({ queryKey: ['exercise_library'] });
    },
  });
}
