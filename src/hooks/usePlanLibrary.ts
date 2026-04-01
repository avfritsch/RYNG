import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.ts';
import { toast } from '../stores/toast-store.ts';
import { checkRateLimit } from '../lib/rate-limit.ts';
import { queryKeys } from '../lib/query-keys.ts';
import type { Plan } from '../types/plan.ts';

export type PublicPlan = Plan & {
  vote_count: number;
  copy_count: number;
  tags: string[];
  muscle_groups: string[];
  equipment: string[];
  author_name: string | null;
};

export function usePublicPlans() {
  return useQuery({
    queryKey: queryKeys.publicPlans(),
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      // Try full query with joins; fall back to plans-only if RLS blocks nested relations
      const { data, error } = await supabase
        .from('plans')
        .select('*, profiles!left(display_name), plan_days!left(plan_exercises!left(muscle_groups, equipment))')
        .eq('is_public', true)
        .order('vote_count', { ascending: false });

      if (error) {
        // Fallback: fetch plans without nested joins
        const { data: fallback, error: fbErr } = await supabase
          .from('plans')
          .select('*')
          .eq('is_public', true)
          .order('vote_count', { ascending: false });
        if (fbErr) throw fbErr;
        return (fallback as (Plan & { vote_count: number; copy_count: number; tags: string[] })[]).map((p) => ({
          ...p, muscle_groups: [], equipment: [], author_name: null,
        } as PublicPlan));
      }

      type RawPlan = Plan & {
        vote_count: number; copy_count: number; tags: string[];
        profiles: { display_name: string | null } | null;
        plan_days: { plan_exercises: { muscle_groups: string[] | null; equipment: string[] | null }[] }[] | null;
      };
      return (data as RawPlan[]).map((p) => {
        const mgs = new Set<string>();
        const eqs = new Set<string>();
        for (const day of p.plan_days ?? []) {
          for (const ex of day.plan_exercises ?? []) {
            for (const mg of ex.muscle_groups ?? []) mgs.add(mg);
            for (const eq of ex.equipment ?? []) eqs.add(eq);
          }
        }
        const { plan_days: _, profiles, ...rest } = p;
        return { ...rest, muscle_groups: [...mgs], equipment: [...eqs], author_name: profiles?.display_name ?? null } as PublicPlan;
      });
    },
  });
}

export function usePlanVotes() {
  return useQuery({
    queryKey: queryKeys.planVotes(),
    staleTime: 1000 * 60 * 10,
    queryFn: async (): Promise<Set<string>> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return new Set();
      const { data, error } = await supabase
        .from('plan_votes')
        .select('plan_id')
        .eq('user_id', user.id);
      if (error) throw error;
      return new Set(data.map((v: { plan_id: string }) => v.plan_id));
    },
  });
}

export function useTogglePlanVote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ planId, hasVoted }: { planId: string; hasVoted: boolean }) => {
      checkRateLimit('plan-vote', 20, 60_000);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      if (hasVoted) {
        await supabase.from('plan_votes').delete().eq('user_id', user.id).eq('plan_id', planId);
      } else {
        await supabase.from('plan_votes').insert({ user_id: user.id, plan_id: planId });
      }
    },
    onMutate: async ({ planId, hasVoted }) => {
      await qc.cancelQueries({ queryKey: queryKeys.planVotes() });
      const previous = qc.getQueryData<Set<string>>(queryKeys.planVotes());
      qc.setQueryData<Set<string>>(queryKeys.planVotes(), (old) => {
        const next = new Set(old);
        if (hasVoted) next.delete(planId); else next.add(planId);
        return next;
      });
      return { previous };
    },
    onError: (_err, _vars, ctx) => { if (ctx?.previous) qc.setQueryData(queryKeys.planVotes(), ctx.previous); },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.planVotes() });
      qc.invalidateQueries({ queryKey: queryKeys.publicPlans() });
    },
  });
}

export function useCopyPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (planId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch source plan
      const { data: plan } = await supabase.from('plans').select('*').eq('id', planId).single();
      if (!plan) throw new Error('Plan not found');

      // Create copy
      const { data: newPlan, error: planErr } = await supabase.from('plans').insert({
        user_id: user.id,
        name: plan.name + ' (Kopie)',
        description: plan.description,
        is_system: false,
        is_public: false,
      }).select().single();
      if (planErr) throw planErr;

      // Copy days
      const { data: days } = await supabase.from('plan_days').select('*').eq('plan_id', planId).order('sort_order');
      const allExercises: Record<string, unknown>[] = [];
      for (const day of (days ?? [])) {
        const { data: newDay } = await supabase.from('plan_days').insert({
          plan_id: newPlan.id,
          label: day.label,
          focus: day.focus,
          sort_order: day.sort_order,
          rounds: day.rounds,
          round_pause: day.round_pause,
          warmup_pause: day.warmup_pause,
        }).select().single();

        if (newDay) {
          const { data: exercises } = await supabase.from('plan_exercises').select('*').eq('day_id', day.id).order('sort_order');
          for (const ex of (exercises ?? [])) {
            allExercises.push({
              day_id: newDay.id,
              name: ex.name,
              speech_name: ex.speech_name,
              track_weight: ex.track_weight ?? false,
              illustration_key: ex.illustration_key,
              muscle_groups: ex.muscle_groups,
              howto: ex.howto,
              animation_key: ex.animation_key,
              is_warmup: ex.is_warmup,
              work_seconds: ex.work_seconds,
              pause_seconds: ex.pause_seconds,
              sort_order: ex.sort_order,
              library_exercise_id: ex.library_exercise_id,
            });
          }
        }
      }
      if (allExercises.length > 0) {
        const { error: exError } = await supabase.from('plan_exercises').insert(allExercises);
        if (exError) throw exError;
      }

      // Increment copy count
      await supabase.from('plans').update({ copy_count: (plan.copy_count ?? 0) + 1 }).eq('id', planId);

      return newPlan;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.plans() });
      qc.invalidateQueries({ queryKey: queryKeys.publicPlans() });
      toast.success('Plan kopiert');
    },
  });
}

export function usePublishPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ planId, isPublic }: { planId: string; isPublic: boolean }) => {
      const { error } = await supabase.from('plans').update({ is_public: isPublic }).eq('id', planId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.plans() });
      qc.invalidateQueries({ queryKey: queryKeys.publicPlans() });
      toast.success('Plan aktualisiert');
    },
  });
}
