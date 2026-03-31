import { create } from 'zustand';

export interface GymSet {
  weight_kg: number | null;
  reps: number | null;
  done: boolean;
}

export interface GymExercise {
  name: string;
  speechName?: string;
  sets: GymSet[];
  restSeconds: number;
  isWarmup: boolean;
  trackWeight: boolean;
}

interface GymStore {
  isActive: boolean;
  exercises: GymExercise[];
  startedAt: number | null;
  activeExerciseIndex: number;

  // Rest timer
  restSeconds: number | null;
  restRunning: boolean;

  start: (exercises: GymExercise[]) => void;
  setActiveExercise: (index: number) => void;
  addSet: (exerciseIndex: number) => void;
  updateSet: (exerciseIndex: number, setIndex: number, patch: Partial<GymSet>) => void;
  removeSet: (exerciseIndex: number, setIndex: number) => void;
  markSetDone: (exerciseIndex: number, setIndex: number) => void;
  startRest: (seconds: number) => void;
  clearRest: () => void;
  tickRest: () => void;
  finish: () => void;
  reset: () => void;
}

export const useGymStore = create<GymStore>((set) => ({
  isActive: false,
  exercises: [],
  startedAt: null,
  activeExerciseIndex: 0,
  restSeconds: null,
  restRunning: false,

  start: (exercises) => set({
    isActive: true,
    exercises,
    startedAt: Date.now(),
    activeExerciseIndex: 0,
    restSeconds: null,
    restRunning: false,
  }),

  setActiveExercise: (index) => set({ activeExerciseIndex: index, restSeconds: null, restRunning: false }),

  addSet: (exerciseIndex) => set((s) => {
    const exercises = [...s.exercises];
    const ex = { ...exercises[exerciseIndex] };
    const lastSet = ex.sets[ex.sets.length - 1];
    ex.sets = [...ex.sets, {
      weight_kg: lastSet?.weight_kg ?? null,
      reps: lastSet?.reps ?? null,
      done: false,
    }];
    exercises[exerciseIndex] = ex;
    return { exercises };
  }),

  updateSet: (exerciseIndex, setIndex, patch) => set((s) => {
    const exercises = [...s.exercises];
    const ex = { ...exercises[exerciseIndex] };
    ex.sets = [...ex.sets];
    ex.sets[setIndex] = { ...ex.sets[setIndex], ...patch };
    exercises[exerciseIndex] = ex;
    return { exercises };
  }),

  removeSet: (exerciseIndex, setIndex) => set((s) => {
    const exercises = [...s.exercises];
    const ex = { ...exercises[exerciseIndex] };
    ex.sets = ex.sets.filter((_, i) => i !== setIndex);
    exercises[exerciseIndex] = ex;
    return { exercises };
  }),

  markSetDone: (exerciseIndex, setIndex) => set((s) => {
    const exercises = [...s.exercises];
    const ex = { ...exercises[exerciseIndex] };
    ex.sets = [...ex.sets];
    ex.sets[setIndex] = { ...ex.sets[setIndex], done: true };
    exercises[exerciseIndex] = ex;
    return { exercises };
  }),

  startRest: (seconds) => set({ restSeconds: seconds, restRunning: true }),
  clearRest: () => set({ restSeconds: null, restRunning: false }),
  tickRest: () => set((s) => {
    if (s.restSeconds === null || s.restSeconds <= 0) return { restSeconds: null, restRunning: false };
    return { restSeconds: s.restSeconds - 1 };
  }),

  finish: () => set({ isActive: false }),
  reset: () => set({
    isActive: false,
    exercises: [],
    startedAt: null,
    activeExerciseIndex: 0,
    restSeconds: null,
    restRunning: false,
  }),
}));
