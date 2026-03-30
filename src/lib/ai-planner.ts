import { supabase } from './supabase.ts';
import type { StationConfig } from '../types/timer.ts';

export interface PlanRequest {
  focus: string;
  equipment: string[];
  durationMinutes: number;
  rounds: number;
  notes: string;
}

export interface GeneratedPlan {
  name: string;
  description: string;
  stations: StationConfig[];
  rounds: number;
  roundPause: number;
}

export async function generatePlan(request: PlanRequest): Promise<GeneratedPlan> {
  const { data, error } = await supabase.functions.invoke('generate-plan', {
    body: request,
  });

  if (error) {
    throw new Error(error.message || 'Fehler bei der Plan-Generierung');
  }

  if (data.error) {
    throw new Error(data.error);
  }

  // Validate the response structure
  if (!data.stations || !Array.isArray(data.stations)) {
    throw new Error('Ungültiger Plan vom KI-Service');
  }

  // Ensure all stations have required fields
  const stations: StationConfig[] = data.stations.map((s: Record<string, unknown>) => ({
    name: String(s.name || 'Übung'),
    muscleGroups: Array.isArray(s.muscleGroups) ? s.muscleGroups.map(String) : [],
    workSeconds: Number(s.workSeconds) || 45,
    pauseSeconds: Number(s.pauseSeconds) || 30,
    isWarmup: Boolean(s.isWarmup),
    howto: String(s.howto || ''),
  }));

  return {
    name: String(data.name || 'KI-Plan'),
    description: String(data.description || ''),
    stations,
    rounds: Number(data.rounds) || 3,
    roundPause: Number(data.roundPause) || 90,
  };
}

/** Save a generated plan to the database as a user plan with one day and all exercises. */
export async function saveGeneratedPlan(plan: GeneratedPlan): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Nicht eingeloggt');

  // 1. Create plan
  const { data: planRow, error: planErr } = await supabase
    .from('plans')
    .insert({ name: plan.name, description: plan.description, user_id: user.id, is_system: false })
    .select()
    .single();
  if (planErr) throw planErr;

  // 2. Create single day
  const { data: dayRow, error: dayErr } = await supabase
    .from('plan_days')
    .insert({
      plan_id: planRow.id,
      label: 'Tag 1',
      focus: plan.name,
      sort_order: 0,
      rounds: plan.rounds,
      round_pause: plan.roundPause,
      warmup_pause: 10,
    })
    .select()
    .single();
  if (dayErr) throw dayErr;

  // 3. Create exercises
  const exercises = plan.stations.map((s, i) => ({
    day_id: dayRow.id,
    name: s.name,
    muscle_groups: s.muscleGroups ?? [],
    howto: s.howto || null,
    is_warmup: s.isWarmup,
    work_seconds: s.workSeconds,
    pause_seconds: s.pauseSeconds,
    sort_order: i,
  }));

  const { error: exErr } = await supabase.from('plan_exercises').insert(exercises);
  if (exErr) throw exErr;

  return planRow.id;
}
