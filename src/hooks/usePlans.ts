import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.ts';
import { withCache } from '../lib/cached-query.ts';
import { toast } from '../stores/toast-store.ts';
import type { Plan, PlanDay, PlanExercise } from '../types/plan.ts';

// --- Queries ---

export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: withCache('plans', 'all', async (): Promise<Plan[]> => {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('is_system', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }),
  });
}

export function usePlan(planId: string | undefined) {
  return useQuery({
    queryKey: ['plan', planId],
    enabled: !!planId && planId !== 'new',
    queryFn: async (): Promise<Plan> => {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('id', planId!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function usePlanDays(planId: string | undefined) {
  return useQuery({
    queryKey: ['plan_days', planId],
    enabled: !!planId,
    queryFn: withCache('plan_days', planId!, async (): Promise<PlanDay[]> => {
      const { data, error } = await supabase
        .from('plan_days')
        .select('*')
        .eq('plan_id', planId!)
        .order('sort_order');
      if (error) throw error;
      return data;
    }),
  });
}

export function usePlanExercises(dayId: string | undefined) {
  return useQuery({
    queryKey: ['plan_exercises', dayId],
    enabled: !!dayId,
    queryFn: withCache('plan_exercises', dayId!, async (): Promise<PlanExercise[]> => {
      const { data, error } = await supabase
        .from('plan_exercises')
        .select('*')
        .eq('day_id', dayId!)
        .order('sort_order');
      if (error) throw error;
      return data;
    }),
  });
}

// --- Mutations ---

export function useCreatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (plan: { name: string; description?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('plans')
        .insert({ ...plan, user_id: user.id, is_system: false })
        .select()
        .single();
      if (error) throw error;
      return data as Plan;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plans'] });
      toast.success('Plan erstellt');
    },
  });
}

export function useUpdatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; description?: string }) => {
      const { data, error } = await supabase
        .from('plans')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Plan;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plans'] }),
  });
}

export function useDeletePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('plans').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plans'] });
      toast.success('Plan gelöscht');
    },
  });
}

// --- Plan Day Mutations ---

export function useCreatePlanDay() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (day: { plan_id: string; label: string; focus?: string; sort_order: number; rounds?: number; round_pause?: number; warmup_pause?: number }) => {
      const { data, error } = await supabase
        .from('plan_days')
        .insert(day)
        .select()
        .single();
      if (error) throw error;
      return data as PlanDay;
    },
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ['plan_days', vars.plan_id] }),
  });
}

export function useUpdatePlanDay() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, plan_id, ...updates }: Partial<PlanDay> & { id: string; plan_id: string }) => {
      const { data, error } = await supabase
        .from('plan_days')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as PlanDay;
    },
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ['plan_days', vars.plan_id] }),
  });
}

export function useDeletePlanDay() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { id: string; plan_id: string }) => {
      const { error } = await supabase.from('plan_days').delete().eq('id', vars.id);
      if (error) throw error;
      return vars;
    },
    onSuccess: (vars) => qc.invalidateQueries({ queryKey: ['plan_days', vars.plan_id] }),
  });
}

// --- Plan Exercise Mutations ---

export function useCreatePlanExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (exercise: { day_id: string; name: string; detail?: string; muscle_group?: string; howto?: string; is_warmup?: boolean; work_seconds: number; pause_seconds: number; sort_order: number }) => {
      const { data, error } = await supabase
        .from('plan_exercises')
        .insert(exercise)
        .select()
        .single();
      if (error) throw error;
      return data as PlanExercise;
    },
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ['plan_exercises', vars.day_id] }),
  });
}

export function useUpdatePlanExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, day_id, ...updates }: Partial<PlanExercise> & { id: string; day_id: string }) => {
      const { data, error } = await supabase
        .from('plan_exercises')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as PlanExercise;
    },
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ['plan_exercises', vars.day_id] }),
  });
}

export function useDeletePlanExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { id: string; day_id: string }) => {
      const { error } = await supabase.from('plan_exercises').delete().eq('id', vars.id);
      if (error) throw error;
      return vars;
    },
    onSuccess: (vars) => qc.invalidateQueries({ queryKey: ['plan_exercises', vars.day_id] }),
  });
}
