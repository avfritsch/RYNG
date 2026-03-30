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

  if (!data.stations || !Array.isArray(data.stations)) {
    throw new Error('Ungültiger Plan vom KI-Service');
  }

  // Parse basic station data from Claude
  const rawStations = data.stations.map((s: Record<string, unknown>) => ({
    name: String(s.name || 'Übung'),
    muscleGroups: Array.isArray(s.muscleGroups) ? s.muscleGroups.map(String) : [],
    workSeconds: Number(s.workSeconds) || 45,
    pauseSeconds: Number(s.pauseSeconds) || 30,
    isWarmup: Boolean(s.isWarmup),
    howto: String(s.howto || ''),
  }));

  // Enrich from exercise library — match by name and pull metadata
  const stations = await enrichFromLibrary(rawStations);

  return {
    name: String(data.name || 'KI-Plan'),
    description: String(data.description || ''),
    stations,
    rounds: Number(data.rounds) || 3,
    roundPause: Number(data.roundPause) || 90,
  };
}

interface RawStation {
  name: string;
  muscleGroups: string[];
  workSeconds: number;
  pauseSeconds: number;
  isWarmup: boolean;
  howto: string;
}

/** Match station names against the exercise library and enrich with metadata */
async function enrichFromLibrary(stations: RawStation[]): Promise<StationConfig[]> {
  // Fetch all library exercises in one query
  const names = stations.map((s) => s.name);
  const { data: libraryExercises } = await supabase
    .from('exercise_library')
    .select('name, muscle_groups, equipment, howto')
    .in('name', names);

  // Build lookup by name (case-insensitive)
  const lookup = new Map<string, { muscle_groups: string[]; equipment: string[]; howto: string | null }>();
  for (const ex of libraryExercises ?? []) {
    lookup.set(ex.name.toLowerCase(), ex);
  }

  // Also try fuzzy matching for names that don't match exactly
  const allExercises = libraryExercises ?? [];

  return stations.map((s) => {
    // Exact match
    let match = lookup.get(s.name.toLowerCase());

    // Fuzzy: try partial match if no exact hit
    if (!match) {
      const nameLower = s.name.toLowerCase();
      const fuzzy = allExercises.find((ex) =>
        ex.name.toLowerCase().includes(nameLower) || nameLower.includes(ex.name.toLowerCase()),
      );
      if (fuzzy) match = { muscle_groups: fuzzy.muscle_groups, equipment: fuzzy.equipment, howto: fuzzy.howto };
    }

    return {
      name: s.name,
      muscleGroups: match?.muscle_groups?.length ? match.muscle_groups : s.muscleGroups,
      workSeconds: s.workSeconds,
      pauseSeconds: s.pauseSeconds,
      isWarmup: s.isWarmup,
      howto: match?.howto || s.howto,
    };
  });
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

  // 3. Create exercises with enriched data
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
