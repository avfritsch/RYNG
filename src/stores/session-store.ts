import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { SessionEntry } from '../types/session.ts';

type Entry = Omit<SessionEntry, 'id' | 'session_id'>;

interface SessionStore {
  entries: Entry[];
  startedAt: number | null;

  start: () => void;
  /** Append an entry, or replace the one for the same station + round (keeps logged weight/reps). */
  addEntry: (entry: Entry) => void;
  updateLastEntry: (
    stationIndex: number,
    roundNumber: number,
    patch: { weight_kg?: number | null; reps?: number | null },
  ) => void;
  reset: () => void;
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set) => ({
      entries: [],
      startedAt: null,

      start: () => set({ entries: [], startedAt: Date.now() }),

      addEntry: (entry) =>
        set((s) => {
          const idx = s.entries.findIndex(
            (e) => e.station_index === entry.station_index && e.round_number === entry.round_number,
          );
          if (idx === -1) return { entries: [...s.entries, entry] };
          const updated = [...s.entries];
          const prev = updated[idx];
          updated[idx] = {
            ...entry,
            weight_kg: entry.weight_kg ?? prev.weight_kg,
            reps: entry.reps ?? prev.reps,
            notes: entry.notes ?? prev.notes,
          };
          return { entries: updated };
        }),

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
    }),
    {
      name: 'ryng_active_session',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
