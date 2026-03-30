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

interface LibraryExercise {
  name: string;
  category: string;
  muscle_groups: string[];
  equipment: string[];
  howto: string | null;
}

export async function generatePlan(request: PlanRequest): Promise<GeneratedPlan> {
  // 1. Fetch exercise library to send as context
  const { data: library } = await supabase
    .from('exercise_library')
    .select('name, category, muscle_groups, equipment, howto')
    .eq('is_public', true)
    .order('usage_count', { ascending: false })
    .limit(150);

  const exercises = (library ?? []) as LibraryExercise[];

  // 2. Call Claude with the library as context
  const { data, error } = await supabase.functions.invoke('generate-plan', {
    body: { ...request, exercises },
  });

  if (error) throw new Error(error.message || 'Fehler bei der Plan-Generierung');
  if (data.error) throw new Error(data.error);
  if (!data.stations || !Array.isArray(data.stations)) throw new Error('Ungültiger Plan vom KI-Service');

  // 3. Build lookup from library
  const lookup = new Map<string, LibraryExercise>();
  for (const ex of exercises) {
    lookup.set(ex.name.toLowerCase(), ex);
  }

  // 4. Map stations — always use library data when available
  const stations: StationConfig[] = data.stations.map((s: Record<string, unknown>) => {
    const name = String(s.name || 'Übung');
    const match = lookup.get(name.toLowerCase())
      ?? [...lookup.values()].find((ex) =>
        ex.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(ex.name.toLowerCase()),
      );

    return {
      name: match?.name ?? name, // Use exact library name if matched
      muscleGroups: match?.muscle_groups ?? [],
      workSeconds: Number(s.workSeconds) || 45,
      pauseSeconds: Number(s.pauseSeconds) || 30,
      isWarmup: Boolean(s.isWarmup),
      howto: match?.howto ?? '',
    };
  });

  return {
    name: String(data.name || 'KI-Plan'),
    description: String(data.description || ''),
    stations,
    rounds: Number(data.rounds) || 3,
    roundPause: Number(data.roundPause) || 90,
  };
}

/** Save a generated plan to the database */
export async function saveGeneratedPlan(plan: GeneratedPlan): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Nicht eingeloggt');

  const { data: planRow, error: planErr } = await supabase
    .from('plans')
    .insert({ name: plan.name, description: plan.description, user_id: user.id, is_system: false })
    .select()
    .single();
  if (planErr) throw planErr;

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
