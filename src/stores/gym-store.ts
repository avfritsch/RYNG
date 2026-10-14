import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface GymSet {
  weight_kg: number | null;
  reps: number | null;
  done: boolean;
}

export interface GymExercise {
  name: string;
  speechName?: string;
  illustrationKey?: string;
  sets: GymSet[];
  restSeconds: number;
  isWarmup: boolean;
  trackWeight: boolean;
  libraryExerciseId?: string;
}

export interface GymSummary {
  exercises: number;
  sets: number;
  totalSeconds: number;
}

interface GymStore {
  /** Overlay is shown (workout running or its summary visible) */
  isActive: boolean;
  exercises: GymExercise[];
  startedAt: number | null;
  activeExerciseIndex: number;
  /** Absolute end time of the current rest, or null */
  restEndsAt: number | null;
  /** Set once the session has been saved — the summary screen is shown */
  summary: GymSummary | null;

  start: (exercises: GymExercise[]) => void;
  setActiveExercise: (index: number) => void;
  addSet: (exerciseIndex: number) => void;
  updateSet: (exerciseIndex: number, setIndex: number, patch: Partial<GymSet>) => void;
  markSetDone: (exerciseIndex: number, setIndex: number) => void;
  startRest: (seconds: number) => void;
  clearRest: () => void;
  finish: (summary: GymSummary) => void;
  reset: () => void;
}

const empty = {
  isActive: false,
  exercises: [] as GymExercise[],
  startedAt: null,
  activeExerciseIndex: 0,
  restEndsAt: null,
  summary: null,
};

function patchSet(
  exercises: GymExercise[],
  exerciseIndex: number,
  setIndex: number,
  patch: Partial<GymSet>,
): GymExercise[] {
  return exercises.map((ex, i) =>
    i !== exerciseIndex
      ? ex
      : { ...ex, sets: ex.sets.map((s, j) => (j === setIndex ? { ...s, ...patch } : s)) },
  );
}

export const useGymStore = create<GymStore>()(
  persist(
    (set) => ({
      ...empty,

      start: (exercises) => set({ ...empty, isActive: true, exercises, startedAt: Date.now() }),

      setActiveExercise: (index) => set({ activeExerciseIndex: index }),

      addSet: (exerciseIndex) => set((s) => ({
        exercises: s.exercises.map((ex, i) => {
          if (i !== exerciseIndex) return ex;
          const last = ex.sets[ex.sets.length - 1];
          return {
            ...ex,
            sets: [...ex.sets, { weight_kg: last?.weight_kg ?? null, reps: last?.reps ?? null, done: false }],
          };
        }),
      })),

      updateSet: (exerciseIndex, setIndex, patch) =>
        set((s) => ({ exercises: patchSet(s.exercises, exerciseIndex, setIndex, patch) })),

      markSetDone: (exerciseIndex, setIndex) =>
        set((s) => ({ exercises: patchSet(s.exercises, exerciseIndex, setIndex, { done: true }) })),

      startRest: (seconds) => set({ restEndsAt: Date.now() + seconds * 1000 }),
      clearRest: () => set({ restEndsAt: null }),

      finish: (summary) => set({ summary, restEndsAt: null }),
      reset: () => set({ ...empty }),
    }),
    {
      name: 'ryng_active_gym',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
