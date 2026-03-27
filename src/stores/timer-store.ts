import { create } from 'zustand';
import type { TimerConfig, TimerState } from '../types/timer.ts';
import { createTimerEngine, unlockAudio, type TimerEngine, type SessionSummary } from '../lib/timer-engine.ts';

const initialState: TimerState = {
  phase: 'idle',
  station: 0,
  round: 0,
  currentSec: 0,
  phaseDuration: 0,
  isRunning: false,
  isPaused: false,
  exerciseStartTime: null,
};

interface TimerStore {
  state: TimerState;
  config: TimerConfig | null;
  engine: TimerEngine | null;
  lastSummary: SessionSummary | null;

  loadConfig: (config: TimerConfig) => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  skipForward: () => void;
  skipBack: () => void;
  stop: () => void;
  reset: () => void;
}

export const useTimerStore = create<TimerStore>((set, get) => ({
  state: initialState,
  config: null,
  engine: null,
  lastSummary: null,

  loadConfig: (config) => {
    const engine = createTimerEngine(config);
    engine.onTick((timerState) => set({ state: timerState }));
    set({ config, engine, lastSummary: null });
  },

  start: () => {
    get().engine?.start();
  },

  pause: () => {
    get().engine?.pause();
  },

  resume: () => {
    unlockAudio();
    get().engine?.resume();
  },

  skipForward: () => {
    get().engine?.skipForward();
  },

  skipBack: () => {
    get().engine?.skipBack();
  },

  stop: () => {
    const engine = get().engine;
    if (engine) {
      const summary = engine.stop();
      set({ lastSummary: summary });
    }
  },

  reset: () => set({ state: initialState, config: null, engine: null, lastSummary: null }),
}));
