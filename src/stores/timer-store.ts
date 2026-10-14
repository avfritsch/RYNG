import { create } from 'zustand';
import type { TimerConfig, TimerState } from '../types/timer.ts';
import {
  createTimerEngine,
  unlockAudio,
  requestWakeLock,
  type TimerEngine,
  type SessionSummary,
  type EngineSnapshot,
} from '../lib/timer-engine.ts';
import { speakDone } from '../lib/speech.ts';
import { useSessionStore } from './session-store.ts';

const STORAGE_KEY = 'ryng_active_timer';
/** A persisted workout older than this is discarded instead of restored. */
const MAX_RESTORE_AGE_MS = 6 * 60 * 60 * 1000;

const initialState: TimerState = {
  phase: 'idle',
  station: 0,
  round: 0,
  currentSec: 0,
  phaseDuration: 0,
  isRunning: false,
  isPaused: false,
  nextStation: 0,
  nextIsNewRound: false,
};

export interface DoneSummary extends SessionSummary {
  /** Unique per finished workout, so the result is saved exactly once. */
  id: string;
}

interface TimerStore {
  state: TimerState;
  config: TimerConfig | null;
  engine: TimerEngine | null;
  lastSummary: DoneSummary | null;
  /** id of the summary that has already been handed to the save logic */
  savedSummaryId: string | null;

  loadConfig: (config: TimerConfig) => void;
  /** Load a config and start it right away (must be called from a user gesture for audio). */
  startWorkout: (config: TimerConfig) => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  skipForward: () => void;
  skipBack: () => void;
  stop: () => void;
  reset: () => void;
  /** Returns true exactly once per summary — guards against double saves. */
  claimSave: () => boolean;
}

// ── Persistence ─────────────────────────────────────────────

interface Persisted {
  config: TimerConfig;
  snapshot: EngineSnapshot;
}

function savePersisted(config: TimerConfig, engine: TimerEngine) {
  try {
    const snapshot = engine.snapshot();
    if (snapshot) localStorage.setItem(STORAGE_KEY, JSON.stringify({ config, snapshot } satisfies Persisted));
  } catch { /* storage full or unavailable */ }
}

function clearPersisted() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

function loadPersisted(): Persisted | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Persisted;
    if (!data?.config?.stations || !data.snapshot) return null;
    if (Date.now() - data.snapshot.savedAt > MAX_RESTORE_AGE_MS) {
      clearPersisted();
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

// ── Store ───────────────────────────────────────────────────

export const useTimerStore = create<TimerStore>((set, get) => {
  /** Wire a fresh engine into the store and the session entry log. */
  function attach(config: TimerConfig, engine: TimerEngine) {
    engine.onEntry((e) => {
      const station = config.stations[e.stationIndex];
      if (!station) return;
      useSessionStore.getState().addEntry({
        station_index: e.stationIndex,
        station_name: station.name,
        is_warmup: station.isWarmup,
        work_seconds: e.plannedSeconds,
        actual_seconds: e.actualSeconds,
        weight_kg: null,
        reps: null,
        notes: null,
        round_number: e.round,
      });
    });

    engine.onTick((timerState) => {
      if (timerState.phase === 'done') {
        clearPersisted();
        const summary = engine.getCompletionSummary();
        if (summary) {
          set({ state: timerState, lastSummary: { ...summary, id: crypto.randomUUID() } });
          speakDone();
          return;
        }
      }
      if (timerState.isRunning) savePersisted(config, engine);
      set({ state: timerState });
    });
  }

  // Restore an interrupted workout (app killed / reloaded mid-training).
  const persisted = typeof localStorage !== 'undefined' ? loadPersisted() : null;
  let restored: { config: TimerConfig; engine: TimerEngine } | null = null;
  if (persisted) {
    const engine = createTimerEngine(persisted.config, persisted.snapshot);
    if (engine.getState().isRunning) {
      restored = { config: persisted.config, engine };
      attach(persisted.config, engine);
    } else {
      clearPersisted();
    }
  }

  return {
    state: restored ? restored.engine.getState() : initialState,
    config: restored?.config ?? null,
    engine: restored?.engine ?? null,
    lastSummary: null,
    savedSummaryId: null,

    loadConfig: (config) => {
      get().engine?.dispose();
      clearPersisted();
      const engine = createTimerEngine(config);
      attach(config, engine);
      set({ config, engine, lastSummary: null, savedSummaryId: null, state: engine.getState() });
    },

    startWorkout: (config) => {
      if (get().state.isRunning) return; // ignore double taps
      unlockAudio();
      get().loadConfig(config);
      useSessionStore.getState().start();
      get().engine?.start();
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
      if (!engine) return;
      const summary = engine.stop();
      clearPersisted();
      set({ lastSummary: { ...summary, id: crypto.randomUUID() } });
    },

    reset: () => {
      get().engine?.dispose();
      clearPersisted();
      set({ state: initialState, config: null, engine: null, lastSummary: null, savedSummaryId: null });
    },

    claimSave: () => {
      const { lastSummary, savedSummaryId } = get();
      if (!lastSummary || savedSummaryId === lastSummary.id) return false;
      set({ savedSummaryId: lastSummary.id });
      return true;
    },
  };
});

// Coming back to the app: re-sync the clock and re-acquire the wake lock
// (browsers release it whenever the page is hidden).
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    const { engine, state } = useTimerStore.getState();
    if (!engine || !state.isRunning) return;
    engine.sync();
    if (!state.isPaused) requestWakeLock();
  });
}
