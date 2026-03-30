export interface StationConfig {
  name: string;
  muscleGroups?: string[];
  workSeconds: number;
  pauseSeconds: number;
  isWarmup: boolean;
  howto: string;
  animationKey?: string;
}

export interface TimerConfig {
  stations: StationConfig[];
  rounds: number;
  roundPause: number;
}

export type TimerPhase = 'work' | 'warmup' | 'pause' | 'roundPause' | 'idle' | 'done';

export interface TimerState {
  phase: TimerPhase;
  station: number;
  round: number;
  currentSec: number;
  phaseDuration: number;
  isRunning: boolean;
  isPaused: boolean;
  exerciseStartTime: number | null;
}
