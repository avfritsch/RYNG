import { supabase } from './supabase.ts';
import type { PlanExercise } from '../types/plan.ts';
import type { Session, SessionEntry } from '../types/session.ts';
import type { StationConfig, TimerConfig } from '../types/timer.ts';
import type { GymExercise } from '../stores/gym-store.ts';

/**
 * Single place that turns stored plans and sessions into runnable workouts.
 * Every screen that starts a workout goes through these functions.
 */

export function planExerciseToStation(e: PlanExercise): StationConfig {
  return {
    name: e.name,
    speechName: e.speech_name ?? undefined,
    muscleGroups: e.muscle_groups ?? undefined,
    workSeconds: e.work_seconds,
    pauseSeconds: e.pause_seconds,
    isWarmup: e.is_warmup,
    howto: e.howto ?? '',
    illustrationKey: e.illustration_key ?? undefined,
    trackWeight: e.track_weight ?? false,
    libraryExerciseId: e.library_exercise_id ?? undefined,
  };
}

const DEFAULT_GYM_SETS = 3;
const DEFAULT_GYM_REST = 90;

export function planExerciseToGymExercise(e: PlanExercise): GymExercise {
  return {
    name: e.name,
    speechName: e.speech_name ?? undefined,
    illustrationKey: e.illustration_key ?? undefined,
    sets: Array.from({ length: DEFAULT_GYM_SETS }, () => ({ weight_kg: null, reps: null, done: false })),
    restSeconds: e.pause_seconds || DEFAULT_GYM_REST,
    isWarmup: e.is_warmup,
    trackWeight: e.track_weight ?? false,
    libraryExerciseId: e.library_exercise_id ?? undefined,
  };
}

export function planDayToConfig(
  day: { id: string; rounds: number; round_pause: number },
  exercises: PlanExercise[],
): TimerConfig {
  return {
    stations: exercises.map(planExerciseToStation),
    rounds: day.rounds,
    roundPause: day.round_pause,
    planDayId: day.id,
  };
}

async function fetchPlanDay(dayId: string) {
  const [exRes, dayRes] = await Promise.all([
    supabase.from('plan_exercises').select('*').eq('day_id', dayId).order('sort_order'),
    supabase.from('plan_days').select('id, rounds, round_pause').eq('id', dayId).single(),
  ]);
  if (exRes.error) throw exRes.error;
  if (dayRes.error) throw dayRes.error;
  return { day: dayRes.data, exercises: (exRes.data ?? []) as PlanExercise[] };
}

/** Circuit config for a plan day. Throws if the day can't be loaded or is empty. */
export async function loadPlanDayConfig(dayId: string): Promise<TimerConfig> {
  const { day, exercises } = await fetchPlanDay(dayId);
  if (exercises.length === 0) throw new Error('Dieser Trainingstag hat keine Übungen');
  return planDayToConfig(day, exercises);
}

/** Gym exercises (non-warmup) for a plan day. */
export async function loadPlanDayGymExercises(dayId: string): Promise<GymExercise[]> {
  const { exercises } = await fetchPlanDay(dayId);
  const gym = exercises.filter((e) => !e.is_warmup).map(planExerciseToGymExercise);
  if (gym.length === 0) throw new Error('Dieser Trainingstag hat keine Kraftübungen');
  return gym;
}

type EntryLike = Pick<SessionEntry, 'station_index' | 'station_name' | 'is_warmup' | 'work_seconds'>;

/**
 * Rebuild a circuit from what was recorded. Lossy (no pauses, howto, weights),
 * so it is only the fallback when the original plan day is gone.
 * Returns null for gym sessions (no timed stations).
 */
export function sessionEntriesToConfig(
  session: Pick<Session, 'rounds'>,
  entries: EntryLike[],
): TimerConfig | null {
  const byIndex = new Map<number, EntryLike>();
  for (const e of entries) {
    if (e.work_seconds > 0 && !byIndex.has(e.station_index)) byIndex.set(e.station_index, e);
  }
  if (byIndex.size === 0) return null;

  const stations: StationConfig[] = [...byIndex.values()]
    .sort((a, b) => a.station_index - b.station_index)
    .map((e) => ({
      name: e.station_name,
      workSeconds: e.work_seconds,
      pauseSeconds: e.is_warmup ? 10 : 30,
      isWarmup: e.is_warmup,
      howto: '',
    }));

  return { stations, rounds: Math.max(1, session.rounds), roundPause: 90 };
}

/** Config to repeat a past session: the original plan day if it still exists, else rebuilt from entries. */
export async function loadSessionRepeatConfig(sessionId: string): Promise<TimerConfig> {
  const [sRes, eRes] = await Promise.all([
    supabase.from('sessions').select('*').eq('id', sessionId).single(),
    supabase.from('session_entries').select('*').eq('session_id', sessionId).order('round_number').order('station_index'),
  ]);
  if (sRes.error) throw sRes.error;
  if (eRes.error) throw eRes.error;
  const session = sRes.data as Session;

  if (session.plan_day_id) {
    try {
      return await loadPlanDayConfig(session.plan_day_id);
    } catch {
      // plan day deleted or emptied — fall back to recorded entries
    }
  }

  const config = sessionEntriesToConfig(session, (eRes.data ?? []) as SessionEntry[]);
  if (!config) throw new Error('Dieses Training kann nicht als Zirkel wiederholt werden');
  return config;
}
