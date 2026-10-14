import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase.ts';
import { clearUserData } from '../lib/clear-user-data.ts';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    let currentUserId: string | null = null;

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        currentUserId = session?.user.id ?? null;
        setSession(session);
      })
      .catch(() => {}) // Graceful fallback on network error
      .finally(() => setLoading(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const nextUserId = session?.user.id ?? null;
        // Signed out, or a different account on the same device: drop all cached user data.
        if (event === 'SIGNED_OUT' || (currentUserId && nextUserId && nextUserId !== currentUserId)) {
          queryClient.clear();
          void clearUserData();
        }
        currentUserId = nextUserId;
        setSession(session);
      },
    );

    return () => subscription.unsubscribe();
  }, [queryClient]);

  return { session, user: session?.user ?? null, loading };
}
