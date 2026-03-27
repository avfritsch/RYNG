import { create } from 'zustand';
import type { SessionEntry } from '../types/session.ts';

interface SessionStore {
  entries: Omit<SessionEntry, 'id' | 'session_id'>[];
  startedAt: number | null;

  start: () => void;
  addEntry: (entry: Omit<SessionEntry, 'id' | 'session_id'>) => void;
  reset: () => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  entries: [],
  startedAt: null,

  start: () => set({ entries: [], startedAt: Date.now() }),

  addEntry: (entry) =>
    set((s) => ({ entries: [...s.entries, entry] })),

  reset: () => set({ entries: [], startedAt: null }),
}));
