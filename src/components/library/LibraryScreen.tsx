import { useState, memo, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useExerciseLibrary, useDeleteLibraryExercise } from '../../hooks/useExerciseLibrary.ts';
import { useLibraryFilters } from '../../hooks/useLibraryFilters.ts';
import { useFavorites, useToggleFavorite } from '../../hooks/useFavorites.ts';
import { usePublicPlans, useCopyPlan } from '../../hooks/usePlanLibrary.ts';
import { usePlans } from '../../hooks/usePlans.ts';
import { useNavigationStore } from '../../stores/navigation-store.ts';
import { CATEGORY_LABELS, EQUIPMENT_OPTIONS, MUSCLE_GROUP_OPTIONS, type ExerciseCategory } from '../../types/exercise-library.ts';
import type { LibraryExercise } from '../../types/exercise-library.ts';
import type { TimerConfig } from '../../types/timer.ts';
import { ExerciseEditModal } from './ExerciseEditModal.tsx';
import { ConfirmModal } from '../ui/ConfirmModal.tsx';
import { Icon } from '../ui/Icon.tsx';
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
  const setPendingConfig = useNavigationStore((s) => s.setPendingConfig);
  const [addToPlanExercise, setAddToPlanExercise] = useState<LibraryExercise | null>(null);
  const { data: userPlans } = usePlans();
  const { data: publicPlans, isLoading: plansLoading } = usePublicPlans();
  const copyPlan = useCopyPlan();

  const listRef = useRef<HTMLDivElement>(null);

  const filteredPlans = useMemo(() => {
    if (!publicPlans) return [];
    if (!filters.search) return publicPlans;
    const q = filters.search.toLowerCase();
    return publicPlans.filter((p) =>
      p.name.toLowerCase().includes(q) || (p.description?.toLowerCase().includes(q)),
    );
  }, [publicPlans, filters.search]);

  const { data: exercises, isLoading } = useExerciseLibrary(filters.queryFilters);

  function handleQuickStart(ex: LibraryExercise) {
    const config: TimerConfig = {
      stations: [{
        name: ex.name,
        workSeconds: 45,
        pauseSeconds: 30,
        isWarmup: ex.category === 'warmup',
        howto: ex.howto ?? '',
      }],
      rounds: 3,
      roundPause: 90,
    };
    setPendingConfig(config);
    navigate('/');
  }

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

  function handleAddToPlan(ex: LibraryExercise) {
    setAddToPlanExercise(ex);
    setSelected(null);
  }

  let filteredExercises = exercises;
  if (filters.showFavoritesOnly && favorites) {
    filteredExercises = filteredExercises?.filter((ex) => favorites.has(ex.id));
  }
  if (filters.showOwnOnly) {
    filteredExercises = filteredExercises?.filter((ex) => ex.created_by !== null);
  }

  // Sort
  if (filteredExercises) {
    filteredExercises = [...filteredExercises].sort((a, b) => {
      if (filters.sortBy === 'name') return a.name.localeCompare(b.name, 'de');
      if (filters.sortBy === 'category') return a.category.localeCompare(b.category) || a.name.localeCompare(b.name, 'de');
      return (b.usage_count ?? 0) - (a.usage_count ?? 0); // popular (default)
    });
  }

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

  const filterCountCat = filters.categories.length;
  const filterCountMg = filters.muscleGroups.length;
  const filterCountEq = filters.equipmentSel.length;

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
              {(['popular', 'name', 'category'] as const).map((s) => (
                <button
                  key={s}
                  className={`library-chip library-chip--sm ${filters.sortBy === s ? 'library-chip--active' : ''}`}
                  onClick={() => filters.setSortBy(s)}
                >
                  {s === 'popular' ? 'Beliebt' : s === 'name' ? 'A–Z' : 'Kategorie'}
                </button>
              ))}
            </div>

            <div className="library-filters">
              <button className="library-filter-header" onClick={() => filters.setCatOpen(!filters.catOpen)}>
                <span>Kategorie{filterCountCat > 0 ? ` (${filterCountCat})` : ''}</span>
                {filterCountCat > 0 && <span className="library-filter-count">{filterCountCat} aktiv</span>}
                <Icon name={filters.catOpen ? 'chevron-up' : 'chevron-down'} size={16} />
              </button>
              {filters.catOpen && (
                <div className="library-chip-wrap">
                  {filters.categories.length > 0 && (
                    <button className="library-chip library-chip--reset" onClick={() => filters.setCategories([])}>Zurücksetzen</button>
                  )}
                  {allCategories.map((cat) => (
                    <button key={cat} className={`library-chip ${filters.categories.includes(cat) ? 'library-chip--active' : ''}`} onClick={() => filters.toggleFilter(filters.categories, cat, filters.setCategories)}>
                      {CATEGORY_LABELS[cat]}
                    </button>
                  ))}
                </div>
              )}

              <button className="library-filter-header" onClick={() => filters.setMgOpen(!filters.mgOpen)}>
                <span>Muskelgruppe{filterCountMg > 0 ? ` (${filterCountMg})` : ''}</span>
                {filterCountMg > 0 && <span className="library-filter-count">{filterCountMg} aktiv</span>}
                <Icon name={filters.mgOpen ? 'chevron-up' : 'chevron-down'} size={16} />
              </button>
              {filters.mgOpen && (
                <div className="library-chip-wrap">
                  {filters.muscleGroups.length > 0 && (
                    <button className="library-chip library-chip--reset" onClick={() => filters.setMuscleGroups([])}>Zurücksetzen</button>
                  )}
                  {MUSCLE_GROUP_OPTIONS.map((mg) => (
                    <button key={mg} className={`library-chip ${filters.muscleGroups.includes(mg) ? 'library-chip--active' : ''}`} onClick={() => filters.toggleFilter(filters.muscleGroups, mg, filters.setMuscleGroups)}>
                      {mg}
                    </button>
                  ))}
                </div>
              )}

              <button className="library-filter-header" onClick={() => filters.setEqOpen(!filters.eqOpen)}>
                <span>Equipment{filterCountEq > 0 ? ` (${filterCountEq})` : ''}</span>
                {filterCountEq > 0 && <span className="library-filter-count">{filterCountEq} aktiv</span>}
                <Icon name={filters.eqOpen ? 'chevron-up' : 'chevron-down'} size={16} />
              </button>
              {filters.eqOpen && (
                <div className="library-chip-wrap">
                  {filters.equipmentSel.length > 0 && (
                    <button className="library-chip library-chip--reset" onClick={() => filters.setEquipmentSel([])}>Zurücksetzen</button>
                  )}
                  {EQUIPMENT_OPTIONS.map((eq) => (
                    <button key={eq} className={`library-chip ${filters.equipmentSel.includes(eq) ? 'library-chip--active' : ''}`} onClick={() => filters.toggleFilter(filters.equipmentSel, eq, filters.setEquipmentSel)}>
                      {eq}
                    </button>
                  ))}
                </div>
              )}
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
              <div key={plan.id} className="card library-card library-card--plan" onClick={() => navigate(`/plans/${plan.id}`, { state: { from: '/library', tab: 'plans' } })}>
                <div className="library-card-header">
                  <div className="library-card-info">
                    <span className="library-card-name">
                      {plan.name}
                      {plan.is_system && <span className="library-card-author"> · System</span>}
                    </span>
                    {plan.description && <span className="library-card-meta">{plan.description}</span>}
                  </div>
                </div>
                <div className="library-card-row2">
                  <span className="library-card-meta">
                    {(plan.copy_count ?? 0) > 0 && `${plan.copy_count}× kopiert`}
                  </span>
                  <div className="library-card-actions-inline">
                    <button className="library-action-btn library-action-btn--primary" onClick={(e) => { e.stopPropagation(); copyPlan.mutate(plan.id); }}>
                      <Icon name="copy" size={14} /> Kopieren
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {addToPlanExercise && myPlans.length > 0 && (
        <div className="picker-overlay" onClick={() => setAddToPlanExercise(null)}>
          <div className="picker-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="picker-header">
              <h3>Zu Plan hinzufügen</h3>
              <button onClick={() => setAddToPlanExercise(null)} aria-label="Schließen">
                <Icon name="x-close" size={18} />
              </button>
            </div>
            <div className="picker-list">
              {myPlans.map((plan) => (
                <button
                  key={plan.id}
                  className="picker-item"
                  onClick={() => {
                    navigate(`/plans/${plan.id}`, { state: { addExercise: addToPlanExercise } });
                    setAddToPlanExercise(null);
                  }}
                >
                  <span className="picker-item-name">{plan.name}</span>
                  <Icon name="arrow-right" size={16} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Memoized Compact Row ---

const LibraryCard = memo(function LibraryCard({
  exercise: ex,
  isFav,
  isSelected,
  onSelect,
  onToggleFav,
  onAddToPlan,
  onQuickStart,
  onEdit,
  onDelete,
}: {
  exercise: LibraryExercise;
  isFav: boolean;
  isSelected: boolean;
  onSelect: (ex: LibraryExercise) => void;
  onToggleFav: (ex: LibraryExercise, isFav: boolean) => void;
  onAddToPlan: (ex: LibraryExercise) => void;
  onQuickStart: (ex: LibraryExercise) => void;
  onEdit: (ex: LibraryExercise) => void;
  onDelete: (ex: LibraryExercise) => void;
}) {
  const metaParts: string[] = [];
  if (ex.muscle_groups?.length > 0) metaParts.push(ex.muscle_groups.join(', '));
  if (ex.equipment.length > 0) metaParts.push(ex.equipment.join(', '));

  return (
    <div
      className={`library-row ${isSelected ? 'library-row--selected' : ''}`}
      onClick={() => onSelect(ex)}
    >
      <div className="library-row-line1">
        <span className="library-row-name">{ex.name}</span>
        <span className={`library-row-cat library-row-cat--${ex.category}`}>
          {CATEGORY_LABELS[ex.category]}
        </span>
      </div>
      <div className="library-row-line2">
        <span className="library-row-meta">
          {metaParts.join(' · ')}
        </span>
        <div className="library-row-icons" onClick={(e) => e.stopPropagation()}>
          <button
            className={`library-row-icon ${isFav ? 'library-row-icon--fav' : ''}`}
            onClick={() => onToggleFav(ex, isFav)}
            aria-label={isFav ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
          >
            <Icon name="heart" size={16} />
          </button>
          <button
            className="library-row-icon"
            onClick={() => onAddToPlan(ex)}
            aria-label="Zum Plan hinzufügen"
          >
            <Icon name="plus" size={16} />
          </button>
        </div>
      </div>

      {isSelected && (
        <div className="library-row-expanded" onClick={(e) => e.stopPropagation()}>
          {ex.howto && <p className="library-row-howto">{ex.howto}</p>}
          <div className="library-row-actions">
            <button className="library-action-btn library-action-btn--primary library-action-btn--sm" onClick={() => onQuickStart(ex)}>
              <Icon name="play" size={14} /> Quick-Start
            </button>
            <button className="library-action-btn library-action-btn--sm" onClick={() => onEdit(ex)}>
              <Icon name="edit" size={14} /> Bearbeiten
            </button>
            {ex.created_by && (
              <button className="library-action-btn library-action-btn--danger library-action-btn--sm" onClick={() => onDelete(ex)}>
                <Icon name="trash" size={14} /> Löschen
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
