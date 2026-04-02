import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.ts';

export interface NotificationPrefs {
  reminder_enabled: boolean;
  reminder_time: string; // HH:MM format
  recap_enabled: boolean;
  comeback_enabled: boolean;
}

const defaults: NotificationPrefs = {
  reminder_enabled: false,
  reminder_time: '18:00',
  recap_enabled: true,
  comeback_enabled: true,
};

export function useNotificationPrefs() {
  return useQuery({
    queryKey: ['notification_prefs'],
    queryFn: async (): Promise<NotificationPrefs> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return defaults;

      const { data } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      return data ?? defaults;
    },
  });
}

export function useUpdateNotificationPrefs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (prefs: Partial<NotificationPrefs>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      await supabase.from('notification_preferences').upsert({
        user_id: user.id,
        ...prefs,
        updated_at: new Date().toISOString(),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notification_prefs'] }),
  });
}
