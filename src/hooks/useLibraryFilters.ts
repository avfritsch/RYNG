import { useState, useEffect, useRef, useCallback } from 'react';
import { SEARCH_DEBOUNCE_MS } from '../lib/constants.ts';
import type { ExerciseCategory } from '../types/exercise-library.ts';

export function useLibraryFilters() {
  const [categories, setCategories] = useState<ExerciseCategory[]>([]);
  const [equipmentSel, setEquipmentSel] = useState<string[]>([]);
  const [muscleGroups, setMuscleGroups] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showOwnOnly, setShowOwnOnly] = useState(false);

  const [catOpen, setCatOpen] = useState(true);
  const [mgOpen, setMgOpen] = useState(false);
  const [eqOpen, setEqOpen] = useState(false);

  // Debounce search
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  const toggleFilter = useCallback(<T,>(arr: T[], val: T, setter: (v: T[]) => void) => {
    setter(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
  }, []);

  const queryFilters = {
    categories: categories.length > 0 ? categories : undefined,
    equipment: equipmentSel.length > 0 ? equipmentSel : undefined,
    muscleGroups: muscleGroups.length > 0 ? muscleGroups : undefined,
    search: debouncedSearch || undefined,
  };

  return {
    // Filter values
    categories, setCategories,
    equipmentSel, setEquipmentSel,
    muscleGroups, setMuscleGroups,
    search, setSearch,
    showFavoritesOnly, setShowFavoritesOnly,
    showOwnOnly, setShowOwnOnly,

    // Panel open state
    catOpen, setCatOpen,
    mgOpen, setMgOpen,
    eqOpen, setEqOpen,

    // Helpers
    toggleFilter,
    queryFilters,
  };
}
