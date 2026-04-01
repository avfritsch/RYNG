import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.ts';
import { queryKeys } from '../lib/query-keys.ts';
import type { Session } from '../types/session.ts';
import type { Plan, PlanDay } from '../types/plan.ts';

export interface Suggestion {
  type: 'next-day' | 'repeat' | 'repeat-week' | 'different' | 'random' | 'create' | 'get-started';
  title: string;
  description: string;
  planId?: string;
  planName?: string;
  dayId?: string;
  dayLabel?: string;
  sessionId?: string;
}

/** Fetch recent sessions (last 30 days) for suggestion engine */
function useRecentSessions() {
  return useQuery({
    queryKey: queryKeys.recentSessions(),
    staleTime: 1000 * 60 * 2,
    queryFn: async (): Promise<Session[]> => {
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .gte('started_at', since.toISOString())
        .order('started_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data;
    },
  });
}

/** Fetch all user plans with their days */
function usePlansWithDays() {
  return useQuery({
    queryKey: queryKeys.plansWithDays(),
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
    const allDays = plansWithDays.flatMap(({ plan, days }) =>
      days.map((d) => ({ plan, day: d })),
    );

    // 1. Continue plan — next day after last session
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

    // 2. Repeat last session
    if (lastSession) {
      result.push({
        type: 'repeat',
        title: 'Letztes Training wiederholen',
        description: `${lastSession.station_count} Übungen · ${lastSession.rounds} Runden · ${Math.round(lastSession.duration_sec / 60)} Min`,
        sessionId: lastSession.id,
      });
    }

    // 3. Different training — a plan day the user hasn't done recently
    if (allDays.length > 0) {
      const recentDayIds = new Set(
        sessions.slice(0, 5).map((s) => s.plan_day_id).filter(Boolean),
      );
      const unseen = allDays.find(({ day }) => !recentDayIds.has(day.id));
      if (unseen) {
        result.push({
          type: 'different',
          title: `${unseen.day.label} — ${unseen.day.focus || unseen.plan.name}`,
          description: `Mal was anderes: ${unseen.plan.name}`,
          planId: unseen.plan.id,
          planName: unseen.plan.name,
          dayId: unseen.day.id,
          dayLabel: unseen.day.label,
        });
      }
    }

    // 4. Training from ~7 days ago
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

    // 5. Random training from a random plan day
    if (allDays.length > 0) {
      const random = allDays[Math.floor(Math.random() * allDays.length)];
      result.push({
        type: 'random',
        title: `${random.day.label} — ${random.day.focus || random.plan.name}`,
        description: 'Zufälliges Training',
        planId: random.plan.id,
        planName: random.plan.name,
        dayId: random.day.id,
        dayLabel: random.day.label,
      });
    }

    // 6. Always offer to create a new training
    result.push({
      type: 'create',
      title: 'Neues Training erstellen',
      description: 'Eigenes Training zusammenstellen',
    });

    // If no sessions and no plans → simplified get-started
    if (!lastSession && allDays.length === 0) {
      return [{
        type: 'get-started' as const,
        title: 'Los geht\'s!',
        description: 'Erstelle dein erstes Training oder wähle einen Plan.',
      }];
    }

    return result;
  }, [sessions, plansWithDays]);

  return { suggestions, isLoading: sessionsLoading || plansLoading };
}
