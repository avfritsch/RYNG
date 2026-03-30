import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.ts';
import type { Session } from '../types/session.ts';
import type { Plan, PlanDay } from '../types/plan.ts';

export interface Suggestion {
  type: 'next-day' | 'repeat' | 'repeat-week' | 'no-plans' | 'get-started';
  title: string;
  description: string;
  planId?: string;
  planName?: string;
  dayId?: string;
  dayLabel?: string;
  sessionId?: string;
}

/** Fetch recent sessions (last 14 days) for suggestion engine */
function useRecentSessions() {
  return useQuery({
    queryKey: ['recent-sessions'],
    staleTime: 1000 * 60 * 2,
    queryFn: async (): Promise<Session[]> => {
      const since = new Date();
      since.setDate(since.getDate() - 14);
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .gte('started_at', since.toISOString())
        .order('started_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });
}

/** Fetch all user plans with their days */
function usePlansWithDays() {
  return useQuery({
    queryKey: ['plans-with-days'],
    staleTime: 1000 * 60 * 5,
    queryFn: async (): Promise<{ plan: Plan; days: PlanDay[] }[]> => {
      const { data: plans, error: pErr } = await supabase
        .from('plans')
        .select('*')
        .order('is_system', { ascending: false })
        .order('updated_at', { ascending: false });
      if (pErr) throw pErr;
      if (!plans || plans.length === 0) return [];

      const { data: days, error: dErr } = await supabase
        .from('plan_days')
        .select('*')
        .in('plan_id', plans.map((p: Plan) => p.id))
        .order('sort_order');
      if (dErr) throw dErr;

      return plans.map((plan: Plan) => ({
        plan,
        days: (days ?? []).filter((d: PlanDay) => d.plan_id === plan.id),
      }));
    },
  });
}

export function useSuggestions() {
  const { data: sessions, isLoading: sessionsLoading } = useRecentSessions();
  const { data: plansWithDays, isLoading: plansLoading } = usePlansWithDays();

  const suggestions = useMemo(() => {
    if (!sessions || !plansWithDays) return [];

    const result: Suggestion[] = [];
    const lastSession = sessions[0];
    const now = Date.now();

    // 1. If last session has a plan_day_id → suggest next day in that plan
    if (lastSession?.plan_day_id) {
      for (const { plan, days } of plansWithDays) {
        const dayIndex = days.findIndex((d) => d.id === lastSession.plan_day_id);
        if (dayIndex >= 0 && days.length > 1) {
          const nextIndex = (dayIndex + 1) % days.length;
          const nextDay = days[nextIndex];
          result.push({
            type: 'next-day',
            title: `${nextDay.label} — ${nextDay.focus || plan.name}`,
            description: `Weiter mit ${plan.name}`,
            planId: plan.id,
            planName: plan.name,
            dayId: nextDay.id,
            dayLabel: nextDay.label,
          });
          break;
        }
      }
    }

    // 2. Repeat last session (if within 48h)
    if (lastSession) {
      const hoursAgo = (now - new Date(lastSession.started_at).getTime()) / (1000 * 60 * 60);
      if (hoursAgo < 48) {
        result.push({
          type: 'repeat',
          title: 'Letztes Training wiederholen',
          description: `${lastSession.station_count} Übungen · ${lastSession.rounds} Runden · ${Math.round(lastSession.duration_sec / 60)} Min`,
          sessionId: lastSession.id,
        });
      }
    }

    // 3. Same training from ~7 days ago
    const weekAgoSession = sessions.find((s) => {
      const daysAgo = (now - new Date(s.started_at).getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo >= 5 && daysAgo <= 9;
    });
    if (weekAgoSession) {
      result.push({
        type: 'repeat-week',
        title: 'Training von letzter Woche',
        description: `${weekAgoSession.station_count} Übungen · ${weekAgoSession.rounds} Runden`,
        sessionId: weekAgoSession.id,
      });
    }

    // 4. If user has custom plans but no recent sessions → suggest starting one
    const customPlans = plansWithDays.filter(({ plan }) => !plan.is_system);
    if (result.length === 0 && customPlans.length > 0) {
      const first = customPlans[0];
      const firstDay = first.days[0];
      if (firstDay) {
        result.push({
          type: 'next-day',
          title: `${firstDay.label} — ${firstDay.focus || first.plan.name}`,
          description: `Starte ${first.plan.name}`,
          planId: first.plan.id,
          planName: first.plan.name,
          dayId: firstDay.id,
          dayLabel: firstDay.label,
        });
      }
    }

    // 5. No plans at all → get started
    if (result.length === 0) {
      result.push({
        type: 'get-started',
        title: 'Erstes Training erstellen',
        description: 'Erstelle einen Plan oder starte mit einem Training aus der Bibliothek.',
      });
    }

    return result;
  }, [sessions, plansWithDays]);

  return { suggestions, isLoading: sessionsLoading || plansLoading };
}
