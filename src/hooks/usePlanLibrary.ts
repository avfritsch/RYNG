import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.ts';
import { toast } from '../stores/toast-store.ts';
import type { Plan } from '../types/plan.ts';

export function usePublicPlans() {
  return useQuery({
    queryKey: ['public_plans'],
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('is_public', true)
        .order('vote_count', { ascending: false });
      if (error) throw error;
      return data as (Plan & { vote_count: number; copy_count: number; tags: string[] })[];
    },
  });
}

export function usePlanVotes() {
  return useQuery({
    queryKey: ['plan_votes'],
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      if (hasVoted) {
        await supabase.from('plan_votes').delete().eq('user_id', user.id).eq('plan_id', planId);
      } else {
        await supabase.from('plan_votes').insert({ user_id: user.id, plan_id: planId });
      }
    },
    onMutate: async ({ planId, hasVoted }) => {
      await qc.cancelQueries({ queryKey: ['plan_votes'] });
      const previous = qc.getQueryData<Set<string>>(['plan_votes']);
      qc.setQueryData<Set<string>>(['plan_votes'], (old) => {
        const next = new Set(old);
        if (hasVoted) next.delete(planId); else next.add(planId);
        return next;
      });
      return { previous };
    },
    onError: (_err, _vars, ctx) => { if (ctx?.previous) qc.setQueryData(['plan_votes'], ctx.previous); },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['plan_votes'] });
      qc.invalidateQueries({ queryKey: ['public_plans'] });
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
            await supabase.from('plan_exercises').insert({
              day_id: newDay.id,
              name: ex.name,
              detail: ex.detail,
              muscle_group: ex.muscle_group,
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

      // Increment copy count
      await supabase.from('plans').update({ copy_count: (plan.copy_count ?? 0) + 1 }).eq('id', planId);

      return newPlan;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plans'] });
      qc.invalidateQueries({ queryKey: ['public_plans'] });
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
      qc.invalidateQueries({ queryKey: ['plans'] });
      qc.invalidateQueries({ queryKey: ['public_plans'] });
      toast.success('Plan aktualisiert');
    },
  });
}
