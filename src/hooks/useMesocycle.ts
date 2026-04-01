import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.ts';
import { withCache } from '../lib/cached-query.ts';
import { defaultProgression } from '../lib/mesocycle.ts';
import { queryKeys } from '../lib/query-keys.ts';
import type { MesocycleConfig } from '../types/database.ts';

export function useMesocycle() {
  return useQuery({
    queryKey: queryKeys.mesocycle(),
    queryFn: withCache('mesocycle', 'current', async (): Promise<MesocycleConfig | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('mesocycle_config')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    }),
  });
}

export function useCreateMesocycle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('mesocycle_config')
        .insert({
          user_id: user.id,
          cycle_length: 4,
          current_week: 1,
          cycle_start: new Date().toISOString().slice(0, 10),
          progression: defaultProgression,
        })
        .select()
        .single();
      if (error) throw error;
      return data as MesocycleConfig;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.mesocycle() }),
  });
}

export function useUpdateMesocycle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MesocycleConfig> & { id: string }) => {
      const { data, error } = await supabase
        .from('mesocycle_config')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as MesocycleConfig;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.mesocycle() }),
  });
}

export function useDeleteMesocycle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('mesocycle_config').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.mesocycle() }),
  });
}
