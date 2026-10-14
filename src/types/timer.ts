export interface StationConfig {
  name: string;
  speechName?: string;
  muscleGroups?: string[];
  workSeconds: number;
  pauseSeconds: number;
  isWarmup: boolean;
  howto: string;
  illustrationKey?: string;
  animationKey?: string;
  trackWeight?: boolean;
}

export interface TimerConfig {
  stations: StationConfig[];
  rounds: number;
  roundPause: number;
  /** Plan day this workout was started from — saved with the session, used for "repeat" */
  planDayId?: string;
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
  /** 1-based index of the next work/warmup station, 0 if none */
  nextStation: number;
  /** True if the next station starts a new round */
  nextIsNewRound: boolean;
}
