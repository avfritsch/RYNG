import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.ts';
import { withCache } from '../lib/cached-query.ts';
import { toast } from '../stores/toast-store.ts';
import type { Preset } from '../types/database.ts';
import type { TimerConfig } from '../types/timer.ts';

export function usePresets() {
  return useQuery({
    queryKey: ['presets'],
    queryFn: withCache('presets', 'all', async (): Promise<Preset[]> => {
      const { data, error } = await supabase
        .from('presets')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }),
  });
}

export function useSavePreset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, config }: { name: string; config: TimerConfig }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const presetData = {
        user_id: user.id,
        name,
        config: {
          rounds: config.rounds,
          stations: config.stations.length,
          roundPause: config.roundPause,
        },
        stations: config.stations.map((s) => ({
          name: s.name,
          work: s.workSeconds,
          pause: s.pauseSeconds,
          howto: s.howto,
          isWarmup: s.isWarmup,
        })),
      };

      const { data, error } = await supabase
        .from('presets')
        .insert(presetData)
        .select()
        .single();
      if (error) throw error;
      return data as Preset;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['presets'] });
      toast.success('Preset gespeichert');
    },
  });
}

export function useDeletePreset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('presets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['presets'] }),
  });
}

/** Convert a preset back to a TimerConfig */
export function presetToConfig(preset: Preset): TimerConfig {
  return {
    rounds: preset.config.rounds,
    roundPause: preset.config.roundPause,
    stations: preset.stations.map((s) => ({
      name: s.name,
      workSeconds: s.work,
      pauseSeconds: s.pause,
      isWarmup: s.isWarmup,
      howto: s.howto,
    })),
  };
}
