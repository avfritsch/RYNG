import { create } from 'zustand';
import type { SessionEntry } from '../types/session.ts';

interface SessionStore {
  entries: Omit<SessionEntry, 'id' | 'session_id'>[];
  startedAt: number | null;

  start: () => void;
  addEntry: (entry: Omit<SessionEntry, 'id' | 'session_id'>) => void;
  updateLastEntry: (stationIndex: number, roundNumber: number, patch: { weight_kg?: number | null; reps?: number | null }) => void;
  reset: () => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  entries: [],
  startedAt: null,

  start: () => set({ entries: [], startedAt: Date.now() }),

  addEntry: (entry) =>
    set((s) => ({ entries: [...s.entries, entry] })),

  updateLastEntry: (stationIndex, roundNumber, patch) =>
    set((s) => {
      const idx = s.entries.findLastIndex(
        (e) => e.station_index === stationIndex && e.round_number === roundNumber,
      );
      if (idx === -1) return s;
      const updated = [...s.entries];
      updated[idx] = { ...updated[idx], ...patch };
      return { entries: updated };
    }),

  reset: () => set({ entries: [], startedAt: null }),
}));
