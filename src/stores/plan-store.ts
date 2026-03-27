import { create } from 'zustand';
import type { Plan, PlanDay, PlanExercise } from '../types/plan.ts';

interface PlanStore {
  currentPlan: Plan | null;
  currentDay: PlanDay | null;
  exercises: PlanExercise[];

  setCurrentPlan: (plan: Plan | null) => void;
  setCurrentDay: (day: PlanDay | null) => void;
  setExercises: (exercises: PlanExercise[]) => void;
  reset: () => void;
}

export const usePlanStore = create<PlanStore>((set) => ({
  currentPlan: null,
  currentDay: null,
  exercises: [],

  setCurrentPlan: (plan) => set({ currentPlan: plan }),
  setCurrentDay: (day) => set({ currentDay: day }),
  setExercises: (exercises) => set({ exercises }),
  reset: () => set({ currentPlan: null, currentDay: null, exercises: [] }),
}));
