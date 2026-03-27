export type { Plan, PlanDay, PlanExercise } from './plan.ts';
export type { Session, SessionEntry } from './session.ts';
export type { TimerConfig, TimerState, TimerPhase, StationConfig } from './timer.ts';

export interface Profile {
  id: string;
  display_name: string | null;
  created_at: string;
}

export interface Preset {
  id: string;
  user_id: string;
  name: string;
  config: {
    rounds: number;
    stations: number;
    roundPause: number;
  };
  stations: {
    name: string;
    work: number;
    pause: number;
    howto: string;
    isWarmup: boolean;
  }[];
  created_at: string;
}

export interface MesocycleConfig {
  id: string;
  user_id: string;
  cycle_length: number;
  current_week: number;
  cycle_start: string;
  progression: Record<string, {
    workMultiplier: number;
    pauseMultiplier: number;
    label: string;
  }>;
  updated_at: string;
}

export interface ExerciseAnimation {
  key: string;
  name: string;
  svg_frames: {
    paths: { d: string; stroke: string; strokeWidth: number }[];
  }[];
  category: string | null;
  created_at: string;
}
