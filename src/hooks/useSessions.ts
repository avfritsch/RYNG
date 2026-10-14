import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.ts';
import { toast } from '../stores/toast-store.ts';
import { queryKeys } from '../lib/query-keys.ts';
import {
  pushSession,
  queueSession,
  isNetworkError,
  type NewSession,
  type NewSessionEntry,
} from '../lib/offline-queue.ts';
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
      const { data, error } = await supabase.from('sessions').select('*').eq('id', sessionId!).single();
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
    /**
     * Saves online when possible. If the network is unavailable the workout is
     * put in the offline outbox and synced later — it is never lost.
     * Resolves to `{ queued: true }` in that case.
     */
    mutationFn: async (payload: {
      session: Omit<Session, 'id' | 'created_at' | 'user_id'> & { user_id?: string };
      entries: Omit<SessionEntry, 'id' | 'session_id'>[];
    }): Promise<{ id: string; queued: boolean }> => {
      // Local session lookup — works offline, unlike auth.getUser().
      const {
        data: { session: auth },
      } = await supabase.auth.getSession();
      const userId = auth?.user.id;
      if (!userId) throw new Error('Nicht angemeldet');

      const sessionId = crypto.randomUUID();
      const session: NewSession = { ...payload.session, id: sessionId, user_id: userId };
      const entries: NewSessionEntry[] = payload.entries.map((e) => ({
        ...e,
        id: crypto.randomUUID(),
        session_id: sessionId,
      }));

      try {
        await pushSession(session, entries);
        return { id: sessionId, queued: false };
      } catch (err) {
        if (!isNetworkError(err)) throw err;
        await queueSession(session, entries, err);
        return { id: sessionId, queued: true };
      }
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: queryKeys.sessions() });
      if (result.queued) {
        toast.info('Offline gespeichert — wird synchronisiert, sobald du online bist');
      } else {
        toast.success('Session gespeichert');
      }
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
