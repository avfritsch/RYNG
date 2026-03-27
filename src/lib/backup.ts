import { z } from 'zod';
import { supabase } from './supabase.ts';

const MAX_IMPORT_SIZE = 10 * 1024 * 1024; // 10MB

const PlanSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  is_system: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

const PlanDaySchema = z.object({
  id: z.string().uuid(),
  plan_id: z.string().uuid(),
  label: z.string(),
  focus: z.string().nullable(),
  sort_order: z.number(),
  rounds: z.number(),
  round_pause: z.number(),
  warmup_pause: z.number(),
  created_at: z.string(),
});

const PlanExerciseSchema = z.object({
  id: z.string().uuid(),
  day_id: z.string().uuid(),
  name: z.string(),
  detail: z.string().nullable(),
  muscle_group: z.string().nullable(),
  howto: z.string().nullable(),
  animation_key: z.string().nullable(),
  is_warmup: z.boolean(),
  work_seconds: z.number(),
  pause_seconds: z.number(),
  sort_order: z.number(),
  created_at: z.string(),
});

const PresetSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string(),
  name: z.string(),
  config: z.object({
    rounds: z.number(),
    stations: z.number(),
    roundPause: z.number(),
  }),
  stations: z.array(z.object({
    name: z.string(),
    work: z.number(),
    pause: z.number(),
    howto: z.string(),
    isWarmup: z.boolean(),
  })),
  created_at: z.string(),
});

const SessionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string(),
  started_at: z.string(),
  finished_at: z.string(),
  duration_sec: z.number(),
  rounds: z.number(),
  station_count: z.number(),
  plan_day_id: z.string().uuid().nullable(),
  mesocycle_week: z.number().nullable(),
  created_at: z.string(),
});

const SessionEntrySchema = z.object({
  id: z.string().uuid(),
  session_id: z.string().uuid(),
  station_index: z.number(),
  station_name: z.string(),
  is_warmup: z.boolean(),
  work_seconds: z.number(),
  actual_seconds: z.number().nullable(),
  weight_kg: z.number().nullable(),
  reps: z.number().nullable(),
  notes: z.string().nullable(),
  round_number: z.number(),
});

const MesocycleSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string(),
  cycle_length: z.number(),
  current_week: z.number(),
  cycle_start: z.string(),
  progression: z.record(z.string(), z.object({
    workMultiplier: z.number(),
    pauseMultiplier: z.number(),
    label: z.string(),
  })),
  updated_at: z.string(),
}).nullable();

const BackupSchema = z.object({
  version: z.literal(1),
  exported_at: z.string(),
  plans: z.array(PlanSchema),
  plan_days: z.array(PlanDaySchema),
  plan_exercises: z.array(PlanExerciseSchema),
  presets: z.array(PresetSchema),
  sessions: z.array(SessionSchema),
  session_entries: z.array(SessionEntrySchema),
  mesocycle_config: MesocycleSchema,
});

type BackupData = z.infer<typeof BackupSchema>;

export async function exportBackup(): Promise<BackupData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const [plans, presets, sessions, mesocycle] = await Promise.all([
    supabase.from('plans').select('*').eq('user_id', user.id),
    supabase.from('presets').select('*').eq('user_id', user.id),
    supabase.from('sessions').select('*').eq('user_id', user.id),
    supabase.from('mesocycle_config').select('*').eq('user_id', user.id).maybeSingle(),
  ]);

  const planIds = (plans.data ?? []).map((p: { id: string }) => p.id);

  let allDays: unknown[] = [];
  let allExercises: unknown[] = [];
  let allEntries: unknown[] = [];

  if (planIds.length > 0) {
    const days = await supabase.from('plan_days').select('*').in('plan_id', planIds);
    allDays = days.data ?? [];

    const dayIds = (allDays as { id: string }[]).map((d) => d.id);
    if (dayIds.length > 0) {
      const exercises = await supabase.from('plan_exercises').select('*').in('day_id', dayIds);
      allExercises = exercises.data ?? [];
    }
  }

  const sessionIds = (sessions.data ?? []).map((s: { id: string }) => s.id);
  if (sessionIds.length > 0) {
    const entries = await supabase.from('session_entries').select('*').in('session_id', sessionIds);
    allEntries = entries.data ?? [];
  }

  return {
    version: 1,
    exported_at: new Date().toISOString(),
    plans: plans.data ?? [],
    plan_days: allDays,
    plan_exercises: allExercises,
    presets: presets.data ?? [],
    sessions: sessions.data ?? [],
    session_entries: allEntries,
    mesocycle_config: mesocycle.data,
  } as BackupData;
}

export function downloadBackup(data: BackupData) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ryng-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importBackup(file: File): Promise<{ imported: number }> {
  // Size limit
  if (file.size > MAX_IMPORT_SIZE) {
    throw new Error(`Datei zu groß (max ${MAX_IMPORT_SIZE / 1024 / 1024}MB)`);
  }

  const text = await file.text();

  // Schema validation
  let data: BackupData;
  try {
    data = BackupSchema.parse(JSON.parse(text));
  } catch (err) {
    if (err instanceof z.ZodError) {
      throw new Error(`Ungültiges Backup-Format: ${err.issues[0]?.message ?? 'Validierungsfehler'}`);
    }
    throw new Error('Ungültiges JSON');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let imported = 0;

  // Referential integrity: collect valid IDs as we go
  const importedPlanIds = new Set<string>();
  const importedDayIds = new Set<string>();
  const importedSessionIds = new Set<string>();

  // Import plans (skip system plans)
  for (const plan of data.plans) {
    if (plan.is_system) continue;
    const { error } = await supabase.from('plans').upsert({
      ...plan,
      user_id: user.id,
    });
    if (!error) {
      imported++;
      importedPlanIds.add(plan.id);
    }
  }

  // Import plan_days (only for imported plans)
  for (const day of data.plan_days) {
    if (!importedPlanIds.has(day.plan_id)) continue;
    const { error } = await supabase.from('plan_days').upsert(day);
    if (!error) importedDayIds.add(day.id);
  }

  // Import plan_exercises (only for imported days)
  for (const ex of data.plan_exercises) {
    if (!importedDayIds.has(ex.day_id)) continue;
    await supabase.from('plan_exercises').upsert(ex);
  }

  // Import presets
  for (const preset of data.presets) {
    await supabase.from('presets').upsert({ ...preset, user_id: user.id });
  }

  // Import sessions
  for (const session of data.sessions) {
    const { error } = await supabase.from('sessions').upsert({ ...session, user_id: user.id });
    if (!error) importedSessionIds.add(session.id);
  }

  // Import session_entries (only for imported sessions)
  for (const entry of data.session_entries) {
    if (!importedSessionIds.has(entry.session_id)) continue;
    await supabase.from('session_entries').upsert(entry);
  }

  // Import mesocycle
  if (data.mesocycle_config) {
    await supabase.from('mesocycle_config').upsert({
      ...data.mesocycle_config,
      user_id: user.id,
    });
  }

  return { imported };
}
