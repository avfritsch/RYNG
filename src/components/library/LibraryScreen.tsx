import { useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useExerciseLibrary, useDeleteLibraryExercise } from '../../hooks/useExerciseLibrary.ts';
import { useLibraryFilters } from '../../hooks/useLibraryFilters.ts';
import { useFavorites, useToggleFavorite } from '../../hooks/useFavorites.ts';
import { usePublicPlans, useCopyPlan } from '../../hooks/usePlanLibrary.ts';
import { usePlans } from '../../hooks/usePlans.ts';
import { useTimerStore } from '../../stores/timer-store.ts';
import { CATEGORY_LABELS, EQUIPMENT_OPTIONS, MUSCLE_GROUP_OPTIONS, type ExerciseCategory } from '../../types/exercise-library.ts';
import type { LibraryExercise } from '../../types/exercise-library.ts';
import type { TimerConfig } from '../../types/timer.ts';
import { ExerciseEditModal } from './ExerciseEditModal.tsx';
import { ConfirmModal } from '../ui/ConfirmModal.tsx';
import { Icon } from '../ui/Icon.tsx';
import { LibraryCard } from './LibraryCard.tsx';
import { AddToPlanPicker } from './AddToPlanPicker.tsx';
import { FilterAccordion } from './FilterAccordion.tsx';
import { SkeletonCard } from '../ui/SkeletonCard.tsx';
import '../../styles/library.css';

const allCategories: ExerciseCategory[] = ['warmup', 'strength', 'core', 'cardio', 'stretch'];

type LibraryTab = 'exercises' | 'plans';

export function LibraryScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialTab = (location.state as { tab?: LibraryTab })?.tab ?? 'exercises';
  const filters = useLibraryFilters();
  const [tab, setTab] = useState<LibraryTab>(initialTab);
  const [selected, setSelected] = useState<LibraryExercise | null>(null);
  const { data: favorites } = useFavorites();
  const toggleFavorite = useToggleFavorite();
  const [editExercise, setEditExercise] = useState<LibraryExercise | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteExercise, setDeleteExercise] = useState<LibraryExercise | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const deleteLibExercise = useDeleteLibraryExercise();
  const startWorkout = useTimerStore((s) => s.startWorkout);
  const [addToPlanExercise, setAddToPlanExercise] = useState<LibraryExercise | null>(null);
  const { data: userPlans } = usePlans();
  const { data: publicPlans, isLoading: plansLoading } = usePublicPlans();
  const copyPlan = useCopyPlan();

  const listRef = useRef<HTMLDivElement>(null);

  const [planMuscleGroups, setPlanMuscleGroups] = useState<string[]>([]);
  const [planEquipment, setPlanEquipment] = useState<string[]>([]);
  const [planMgOpen, setPlanMgOpen] = useState(false);
  const [planEqOpen, setPlanEqOpen] = useState(false);

  function togglePlanFilter<T>(arr: T[], val: T, setter: (v: T[]) => void) {
    setter(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
  }

  const filteredPlans = useMemo(() => {
    if (!publicPlans) return [];
    let result = publicPlans;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter((p) =>
        p.name.toLowerCase().includes(q) || (p.description?.toLowerCase().includes(q)),
      );
    }
    if (planMuscleGroups.length > 0) {
      result = result.filter((p) =>
        planMuscleGroups.some((mg) => p.muscle_groups.includes(mg)),
      );
    }
    if (planEquipment.length > 0) {
      result = result.filter((p) =>
        planEquipment.some((eq) => p.equipment.includes(eq)),
      );
    }
    return result;
  }, [publicPlans, filters.search, planMuscleGroups, planEquipment]);

  const { data: exercises, isLoading } = useExerciseLibrary(filters.queryFilters);

  const handleQuickStart = useCallback((ex: LibraryExercise) => {
    const config: TimerConfig = {
      stations: [{
        name: ex.name,
        speechName: ex.speech_name ?? undefined,
        workSeconds: 45,
        pauseSeconds: 30,
        isWarmup: ex.category === 'warmup',
        howto: ex.howto ?? '',
        illustrationKey: ex.illustration_key ?? undefined,
        trackWeight: ex.track_weight ?? false,
      }],
      rounds: 3,
      roundPause: 90,
    };
    // The timer is a fullscreen overlay; no navigation needed.
    startWorkout(config);
  }, [startWorkout]);

  const handleSelect = useCallback((ex: LibraryExercise) => {
    setSelected((prev) => prev?.id === ex.id ? null : ex);
  }, []);

  const handleToggleFav = useCallback((ex: LibraryExercise, isFav: boolean) => {
    toggleFavorite.mutate({ exerciseId: ex.id, isFavorite: isFav });
  }, [toggleFavorite]);

  const handleEdit = useCallback((ex: LibraryExercise) => {
    setEditExercise(ex);
    setSelected(null);
  }, []);

  const handleDelete = useCallback((ex: LibraryExercise) => {
    setDeleteExercise(ex);
    setSelected(null);
  }, []);

  const handleAddToPlan = useCallback((ex: LibraryExercise) => {
    setAddToPlanExercise(ex);
    setSelected(null);
  }, []);

  const filteredExercises = useMemo(() => {
    let result = exercises;
    if (filters.showFavoritesOnly && favorites) {
      result = result?.filter((ex) => favorites.has(ex.id));
    }
    if (filters.showOwnOnly) {
      result = result?.filter((ex) => ex.created_by !== null);
    }
    if (result) {
      result = [...result].sort((a, b) => {
        if (filters.sortBy === 'name') return a.name.localeCompare(b.name, 'de');
        if (filters.sortBy === 'category') return a.category.localeCompare(b.category) || a.name.localeCompare(b.name, 'de');
        return (b.usage_count ?? 0) - (a.usage_count ?? 0); // popular (default)
      });
    }
    return result;
  }, [exercises, favorites, filters.showFavoritesOnly, filters.showOwnOnly, filters.sortBy]);

  // Category grouping
  const shouldGroup = useMemo(() => {
    if (filters.search) return false;
    if (filters.categories.length === 1) return false;
    return true;
  }, [filters.search, filters.categories]);

  const groupedExercises = useMemo(() => {
    if (!filteredExercises || !shouldGroup) return null;
    const map = new Map<ExerciseCategory, LibraryExercise[]>();
    for (const cat of allCategories) {
      const items = filteredExercises.filter((ex) => ex.category === cat);
      if (items.length > 0) map.set(cat, items);
    }
    return map;
  }, [filteredExercises, shouldGroup]);

  // Active filter info
  const activeFilterLabels = useMemo(() => {
    const labels: { key: string; label: string; onRemove: () => void }[] = [];
    for (const cat of filters.categories) {
      labels.push({ key: `cat-${cat}`, label: CATEGORY_LABELS[cat], onRemove: () => filters.toggleFilter(filters.categories, cat, filters.setCategories) });
    }
    for (const mg of filters.muscleGroups) {
      labels.push({ key: `mg-${mg}`, label: mg, onRemove: () => filters.toggleFilter(filters.muscleGroups, mg, filters.setMuscleGroups) });
    }
    for (const eq of filters.equipmentSel) {
      labels.push({ key: `eq-${eq}`, label: eq, onRemove: () => filters.toggleFilter(filters.equipmentSel, eq, filters.setEquipmentSel) });
    }
    return labels;
  }, [filters]);

  const hasActiveFilters = activeFilterLabels.length > 0 || filters.showFavoritesOnly || filters.showOwnOnly;

  function clearAllFilters() {
    filters.setCategories([]);
    filters.setMuscleGroups([]);
    filters.setEquipmentSel([]);
    filters.setShowFavoritesOnly(false);
    filters.setShowOwnOnly(false);
    filters.setSearch('');
  }

  // Alphabet nav letters
  // Result count text
  const resultCountText = useMemo(() => {
    const count = filteredExercises?.length ?? 0;
    if (!hasActiveFilters && !filters.search) return `${count} Übungen`;
    const filterNames = activeFilterLabels.map((f) => f.label);
    if (filters.search) filterNames.unshift(filters.search);
    if (filterNames.length > 0) return `${count} Übungen für «${filterNames.join(', ')}»`;
    return `${count} Übungen`;
  }, [filteredExercises, hasActiveFilters, filters.search, activeFilterLabels]);


  const myPlans = userPlans?.filter((p) => !p.is_system) ?? [];

  // Render grouped list
  function renderGroupedList() {
    if (!groupedExercises) return null;
    const sections: React.ReactNode[] = [];
    for (const [cat, items] of groupedExercises) {
      const isCollapsed = collapsedGroups.has(cat);
      sections.push(
        <div key={cat} className="library-group">
          <button
            className="library-group-header"
            onClick={() => setCollapsedGroups((prev) => {
              const next = new Set(prev);
              if (next.has(cat)) next.delete(cat); else next.add(cat);
              return next;
            })}
          >
            <span>{CATEGORY_LABELS[cat].toUpperCase()} ({items.length})</span>
            <Icon name={isCollapsed ? 'chevron-right' : 'chevron-down'} size={14} />
          </button>
          {!isCollapsed && items.map((ex) => {
            return (
              <LibraryCard
                key={ex.id}
                exercise={ex}
                isFav={favorites?.has(ex.id) ?? false}
                isSelected={selected?.id === ex.id}
                onSelect={handleSelect}
                onToggleFav={handleToggleFav}
                onAddToPlan={handleAddToPlan}
                onQuickStart={handleQuickStart}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            );
          })}
        </div>,
      );
    }
    return <>{sections}</>;
  }

  // Render flat list
  function renderFlatList() {
    if (!filteredExercises) return null;
    return filteredExercises.map((ex) => (
        <LibraryCard
          key={ex.id}
          exercise={ex}
          isFav={favorites?.has(ex.id) ?? false}
          isSelected={selected?.id === ex.id}
          onSelect={handleSelect}
          onToggleFav={handleToggleFav}
          onAddToPlan={handleAddToPlan}
          onQuickStart={handleQuickStart}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
    ));
  }

  return (
    <div className="library-screen">
      {/* Sticky header area */}
      <div className="library-sticky">
        <div className="library-title-row">
          <h2 className="library-title">Bibliothek</h2>
          {tab === 'exercises' && (
            <button className="library-create-btn" onClick={() => setShowCreate(true)}>
              <Icon name="plus" size={16} /> Neue Übung
            </button>
          )}
          {tab === 'plans' && (
            <button className="library-create-btn" onClick={() => navigate('/plans/quick')}>
              <Icon name="plus" size={16} /> Neues Training
            </button>
          )}
        </div>

        <div className="library-tabs">
          <button
            className={`library-tab ${tab === 'exercises' ? 'library-tab--active' : ''}`}
            onClick={() => setTab('exercises')}
          >
            Übungen
          </button>
          <button
            className={`library-tab ${tab === 'plans' ? 'library-tab--active' : ''}`}
            onClick={() => setTab('plans')}
          >
            Trainings
          </button>
        </div>

        <div className="library-search">
          <Icon name="search" size={18} />
          <input
            className="library-search-input"
            placeholder={tab === 'exercises' ? 'Übung suchen...' : 'Training suchen...'}
            value={filters.search}
            onChange={(e) => filters.setSearch(e.target.value)}
            aria-label="Suchen"
          />
          {filters.search && (
            <button className="library-search-clear" onClick={() => filters.setSearch('')}>
              <Icon name="x-close" size={14} />
            </button>
          )}
        </div>

        {tab === 'plans' && (
          <div className="library-filters">
            <FilterAccordion
              label="Muskelgruppe"
              options={MUSCLE_GROUP_OPTIONS}
              selected={planMuscleGroups}
              open={planMgOpen}
              onToggleOpen={() => setPlanMgOpen(!planMgOpen)}
              onToggle={(mg) => togglePlanFilter(planMuscleGroups, mg, setPlanMuscleGroups)}
              onReset={() => setPlanMuscleGroups([])}
            />
            <FilterAccordion
              label="Equipment"
              options={EQUIPMENT_OPTIONS}
              selected={planEquipment}
              open={planEqOpen}
              onToggleOpen={() => setPlanEqOpen(!planEqOpen)}
              onToggle={(eq) => togglePlanFilter(planEquipment, eq, setPlanEquipment)}
              onReset={() => setPlanEquipment([])}
            />
          </div>
        )}

        {tab === 'exercises' && (
          <>
            <div className="library-fav-toggle">
              <button
                className={`library-chip ${filters.showFavoritesOnly ? 'library-chip--active' : ''}`}
                onClick={() => filters.setShowFavoritesOnly(!filters.showFavoritesOnly)}
              >
                <Icon name="heart" size={14} /> Favoriten
              </button>
              <button
                className={`library-chip ${filters.showOwnOnly ? 'library-chip--active' : ''}`}
                onClick={() => filters.setShowOwnOnly(!filters.showOwnOnly)}
              >
                <Icon name="user" size={14} /> Eigene
              </button>
              <span className="library-sort-sep">|</span>
              {(['popular', 'name'] as const).map((s) => (
                <button
                  key={s}
                  className={`library-chip library-chip--sm ${filters.sortBy === s ? 'library-chip--active' : ''}`}
                  onClick={() => filters.setSortBy(s)}
                >
                  {s === 'popular' ? 'Beliebt' : 'A–Z'}
                </button>
              ))}
            </div>

            <div className="library-filters">
              <FilterAccordion
                label="Muskelgruppe"
                options={MUSCLE_GROUP_OPTIONS}
                selected={filters.muscleGroups}
                open={filters.mgOpen}
                onToggleOpen={() => filters.setMgOpen(!filters.mgOpen)}
                onToggle={(mg) => filters.toggleFilter(filters.muscleGroups, mg, filters.setMuscleGroups)}
                onReset={() => filters.setMuscleGroups([])}
              />
              <FilterAccordion
                label="Equipment"
                options={EQUIPMENT_OPTIONS}
                selected={filters.equipmentSel}
                open={filters.eqOpen}
                onToggleOpen={() => filters.setEqOpen(!filters.eqOpen)}
                onToggle={(eq) => filters.toggleFilter(filters.equipmentSel, eq, filters.setEquipmentSel)}
                onReset={() => filters.setEquipmentSel([])}
              />
            </div>
          </>
        )}
      </div>

      {/* Result count + filter pills */}
      {tab === 'exercises' && filteredExercises && (
        <div className="library-result-bar">
          <span className="library-result-count">{resultCountText}</span>
          {activeFilterLabels.length > 0 && (
            <div className="library-active-pills">
              {activeFilterLabels.map((f) => (
                <button key={f.key} className="library-pill" onClick={f.onRemove}>
                  {f.label} <Icon name="x-close" size={10} />
                </button>
              ))}
              <button className="library-pill-clear" onClick={clearAllFilters}>
                Alle löschen
              </button>
            </div>
          )}
        </div>
      )}

      {/* Exercise list */}
      {tab === 'exercises' && (
        <>
          {isLoading ? (
            <SkeletonCard count={5} />
          ) : filteredExercises && filteredExercises.length === 0 ? (
            <div className="library-empty">
              <div className="library-empty-title">Keine Übungen gefunden</div>
              <p className="library-empty-desc">
                Versuche andere Filter oder erstelle eine neue Übung.
              </p>
              <button className="library-create-btn" onClick={() => setShowCreate(true)}>
                <Icon name="plus" size={16} /> Neue Übung erstellen
              </button>
            </div>
          ) : (
            <div className="library-list" ref={listRef}>
              {shouldGroup ? renderGroupedList() : renderFlatList()}
            </div>
          )}


          {deleteExercise && (
            <ConfirmModal
              title="Übung löschen"
              message={`"${deleteExercise.name}" wird unwiderruflich gelöscht.`}
              confirmLabel="Löschen"
              danger
              onCancel={() => setDeleteExercise(null)}
              onConfirm={() => { deleteLibExercise.mutate(deleteExercise.id); setDeleteExercise(null); }}
            />
          )}

          {editExercise && (
            <ExerciseEditModal exercise={editExercise} onClose={() => setEditExercise(null)} />
          )}

          {showCreate && (
            <ExerciseEditModal onClose={() => setShowCreate(false)} />
          )}
        </>
      )}

      {tab === 'plans' && (
        plansLoading ? (
          <SkeletonCard count={4} />
        ) : filteredPlans.length === 0 ? (
          <p className="library-empty">Keine Trainings gefunden.</p>
        ) : (
          <div className="library-list">
            {filteredPlans.map((plan) => (
              <div key={plan.id} className="library-plan-row" onClick={() => navigate(`/plans/${plan.id}`, { state: { from: '/library', tab: 'plans' } })}>
                <div className="library-plan-row-info">
                  <span className="library-plan-row-name">
                    {plan.name}
                    <span className="library-plan-row-author">
                      {plan.is_system ? ' · System' : plan.author_name ? ` · ${plan.author_name}` : ''}
                    </span>
                  </span>
                  {plan.description && <span className="library-plan-row-desc">{plan.description}</span>}
                </div>
                <button className="library-plan-row-copy" onClick={(e) => { e.stopPropagation(); copyPlan.mutate(plan.id, { onSuccess: (newPlan) => { navigate(`/plans/${newPlan.id}`); } }); }} aria-label="Kopieren">
                  <Icon name="copy" size={16} />
                </button>
              </div>
            ))}
          </div>
        )
      )}

      {addToPlanExercise && myPlans.length > 0 && (
        <AddToPlanPicker
          plans={myPlans}
          onPick={(planId) => {
            navigate(`/plans/${planId}`, { state: { addExercise: addToPlanExercise } });
            setAddToPlanExercise(null);
          }}
          onClose={() => setAddToPlanExercise(null)}
        />
      )}
    </div>
  );
}
