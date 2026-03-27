import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.ts';
import { toast } from '../stores/toast-store.ts';
import type { LibraryExercise, ExerciseCategory } from '../types/exercise-library.ts';

interface LibraryFilters {
  categories?: ExerciseCategory[];
  equipment?: string[];
  muscleGroups?: string[];
  search?: string;
}

export function useExerciseLibrary(filters: LibraryFilters = {}) {
  return useQuery({
    queryKey: ['exercise_library', filters],
    staleTime: 1000 * 60 * 5, // 5 min cache
    queryFn: async (): Promise<LibraryExercise[]> => {
      let query = supabase
        .from('exercise_library')
        .select('*')
        .order('usage_count', { ascending: false })
        .order('name');

      if (filters.categories && filters.categories.length > 0) {
        query = query.in('category', filters.categories);
      }

      if (filters.equipment && filters.equipment.length > 0) {
        // overlaps: matches if array has ANY of the given values
        query = query.overlaps('equipment', filters.equipment);
      }

      if (filters.muscleGroups && filters.muscleGroups.length > 0) {
        query = query.in('muscle_group', filters.muscleGroups);
      }

      if (filters.search) {
        query = query.textSearch('fts', filters.search, { type: 'websearch', config: 'german' });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateLibraryExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (exercise: {
      name: string;
      detail?: string;
      muscle_group?: string;
      category: ExerciseCategory;
      howto?: string;
      equipment?: string[];
      tags?: string[];
      is_public?: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('exercise_library')
        .insert({ ...exercise, created_by: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as LibraryExercise;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exercise_library'] });
      toast.success('Übung erstellt');
    },
  });
}

export function useUpdateLibraryExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LibraryExercise> & { id: string }) => {
      const { data, error } = await supabase
        .from('exercise_library')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as LibraryExercise;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exercise_library'] });
      toast.success('Übung aktualisiert');
    },
  });
}

export function useDeleteLibraryExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('exercise_library').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exercise_library'] });
      toast.success('Übung gelöscht');
    },
  });
}

/** Copy a library exercise into plan_exercises (snapshot). */
export function useCopyToplan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      exercise: LibraryExercise;
      dayId: string;
      sortOrder: number;
      isWarmup: boolean;
      workSeconds: number;
      pauseSeconds: number;
    }) => {
      const { exercise, dayId, sortOrder, isWarmup, workSeconds, pauseSeconds } = params;

      const { data, error } = await supabase
        .from('plan_exercises')
        .insert({
          day_id: dayId,
          name: exercise.name,
          detail: exercise.detail,
          muscle_group: exercise.muscle_group,
          howto: exercise.howto,
          is_warmup: isWarmup,
          work_seconds: workSeconds,
          pause_seconds: pauseSeconds,
          sort_order: sortOrder,
          library_exercise_id: exercise.id,
        })
        .select()
        .single();
      if (error) throw error;

      // Increment usage count (best-effort)
      supabase.rpc('increment_usage_count', { exercise_id: exercise.id });

      return data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['plan_exercises', vars.dayId] });
      toast.success(`"${vars.exercise.name}" hinzugefügt`);
    },
  });
}
