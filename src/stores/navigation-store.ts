import { create } from 'zustand';
import type { TimerConfig } from '../types/timer.ts';

interface PendingExercise {
  name: string;
  muscle_groups: string[];
  howto: string | null;
  category: string;
  library_exercise_id: string;
}

interface NavigationStore {
  pendingConfig: TimerConfig | null;
  pendingExercise: PendingExercise | null;

  setPendingConfig: (config: TimerConfig) => void;
  setPendingExercise: (ex: PendingExercise) => void;
  clearPendingConfig: () => void;
  clearPendingExercise: () => void;
}

export const useNavigationStore = create<NavigationStore>((set) => ({
  pendingConfig: null,
  pendingExercise: null,

  setPendingConfig: (config) => set({ pendingConfig: config }),
  setPendingExercise: (ex) => set({ pendingExercise: ex }),
  clearPendingConfig: () => set({ pendingConfig: null }),
  clearPendingExercise: () => set({ pendingExercise: null }),
}));
