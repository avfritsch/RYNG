import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.ts';
import { toast } from '../stores/toast-store.ts';
import { queryKeys } from '../lib/query-keys.ts';
import { logger } from '../lib/logger.ts';
import type { Session, SessionEntry } from '../types/session.ts';

export type SessionFilter = 'week' | 'month' | 'all';

function getFilterDate(filter: SessionFilter): string | null {
  const now = new Date();
  if (filter === 'week') {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d.toISOString();
  }
  if (filter === 'month') {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 1);
    return d.toISOString();
  }
  return null;
}

export function useSessions(filter: SessionFilter = 'all') {
  return useQuery({
    queryKey: queryKeys.sessions(filter),
    queryFn: async (): Promise<Session[]> => {
      let query = supabase
        .from('sessions')
        .select('*')
        .gt('station_count', 0)
        .order('started_at', { ascending: false });

      const since = getFilterDate(filter);
      if (since) {
        query = query.gte('started_at', since);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useSession(sessionId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.session(sessionId!),
    enabled: !!sessionId,
    queryFn: async (): Promise<Session> => {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useSessionEntries(sessionId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.sessionEntries(sessionId!),
    enabled: !!sessionId,
    queryFn: async (): Promise<SessionEntry[]> => {
      const { data, error } = await supabase
        .from('session_entries')
        .select('*')
        .eq('session_id', sessionId!)
        .order('round_number')
        .order('station_index');
      if (error) throw error;
      return data;
    },
  });
}

export function useSaveSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      session: Omit<Session, 'id' | 'created_at' | 'user_id'> & { user_id?: string };
      entries: Omit<SessionEntry, 'id' | 'session_id'>[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Insert session
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .insert({ ...payload.session, user_id: user.id })
        .select()
        .single();
      if (sessionError) throw sessionError;

      // Insert entries
      if (payload.entries.length > 0) {
        const entries = payload.entries.map((e) => ({
          ...e,
          session_id: sessionData.id,
        }));
        try {
          const { error: entriesError } = await supabase
            .from('session_entries')
            .insert(entries);
          if (entriesError) throw entriesError;
        } catch (entriesErr) {
          // Clean up orphaned session before re-throwing
          try { await supabase.from('sessions').delete().eq('id', sessionData.id); } catch { /* best-effort cleanup */ }
          throw entriesErr;
        }
      }

      // Increment usage count for all exercises performed (best-effort)
      const exerciseNames = [...new Set(payload.entries.map((e) => e.station_name))];
      if (exerciseNames.length > 0) {
        supabase.rpc('increment_exercise_usage_by_names', { exercise_names: exerciseNames })
          .then(null, (e) => logger.warn('Usage increment failed', { error: String(e) }));
      }

      return sessionData as Session;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.sessions() });
      toast.success('Session gespeichert');
    },
  });
}

export function useDeleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      // Delete entries first
      await supabase.from('session_entries').delete().eq('session_id', sessionId);
      const { error } = await supabase.from('sessions').delete().eq('id', sessionId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.sessions() });
      toast.success('Session gelöscht');
    },
  });
}
