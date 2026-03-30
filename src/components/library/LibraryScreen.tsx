import { useState, memo, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExerciseLibrary, useDeleteLibraryExercise } from '../../hooks/useExerciseLibrary.ts';
import { useLibraryFilters } from '../../hooks/useLibraryFilters.ts';
import { useFavorites, useToggleFavorite } from '../../hooks/useFavorites.ts';
import { usePublicPlans, useCopyPlan } from '../../hooks/usePlanLibrary.ts';
import { useNavigationStore } from '../../stores/navigation-store.ts';
import { CATEGORY_LABELS, EQUIPMENT_OPTIONS, MUSCLE_GROUP_OPTIONS, type ExerciseCategory } from '../../types/exercise-library.ts';
import type { LibraryExercise } from '../../types/exercise-library.ts';
import type { TimerConfig } from '../../types/timer.ts';
import { ExerciseEditModal } from './ExerciseEditModal.tsx';
import { ConfirmModal } from '../ui/ConfirmModal.tsx';
import { Icon } from '../ui/Icon.tsx';
import { SkeletonCard } from '../ui/SkeletonCard.tsx';
import '../../styles/library.css';

const allCategories: ExerciseCategory[] = ['warmup', 'strength', 'core', 'cardio', 'stretch', 'mobility'];

type LibraryTab = 'exercises' | 'plans';

export function LibraryScreen() {
  const navigate = useNavigate();
  const filters = useLibraryFilters();
  const [tab, setTab] = useState<LibraryTab>('exercises');
  const [selected, setSelected] = useState<LibraryExercise | null>(null);
  const { data: favorites } = useFavorites();
  const toggleFavorite = useToggleFavorite();
  const [editExercise, setEditExercise] = useState<LibraryExercise | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteExercise, setDeleteExercise] = useState<LibraryExercise | null>(null);
  const deleteLibExercise = useDeleteLibraryExercise();
  const setPendingConfig = useNavigationStore((s) => s.setPendingConfig);
  const setPendingExercise = useNavigationStore((s) => s.setPendingExercise);
  const { data: publicPlans, isLoading: plansLoading } = usePublicPlans();
  const copyPlan = useCopyPlan();

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
        howto: ex.detail ?? '',
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
    setPendingExercise({
      name: ex.name,
      detail: ex.detail,
      muscle_group: ex.muscle_group,
      howto: ex.howto,
      category: ex.category,
      library_exercise_id: ex.id,
    });
    navigate('/plans');
  }

  let filteredExercises = exercises;
  if (filters.showFavoritesOnly && favorites) {
    filteredExercises = filteredExercises?.filter((ex) => favorites.has(ex.id));
  }
  if (filters.showOwnOnly) {
    filteredExercises = filteredExercises?.filter((ex) => ex.created_by !== null);
  }

  return (
    <div className="library-screen">
      <div className="library-title-row">
        <h2 className="library-title">Bibliothek</h2>
        {tab === 'exercises' && (
          <button className="library-create-btn" onClick={() => setShowCreate(true)}>
            <Icon name="plus" size={16} /> Neue Übung
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
          Pläne
        </button>
      </div>

      <div className="library-search">
        <Icon name="search" size={18} />
        <input
          className="library-search-input"
          placeholder={tab === 'exercises' ? 'Übung suchen...' : 'Plan suchen...'}
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
      </div>
      )}

      {tab === 'exercises' && <>
      <div className="library-filters">
        <button className="library-filter-header" onClick={() => filters.setCatOpen(!filters.catOpen)}>
          <span>Kategorie</span>
          {filters.categories.length > 0 && <span className="library-filter-tag">{filters.categories.length} aktiv</span>}
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
          <span>Muskelgruppe</span>
          {filters.muscleGroups.length > 0 && <span className="library-filter-tag">{filters.muscleGroups.length} aktiv</span>}
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
          <span>Equipment</span>
          {filters.equipmentSel.length > 0 && <span className="library-filter-tag">{filters.equipmentSel.length} aktiv</span>}
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

      {isLoading ? (
        <SkeletonCard count={5} />
      ) : filteredExercises && filteredExercises.length === 0 ? (
        <p className="library-empty">Keine Übungen gefunden.</p>
      ) : (
        <div className="library-list">
          {filteredExercises?.map((ex) => (
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
          ))}
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
      </>}

      {tab === 'plans' && (
        plansLoading ? (
          <SkeletonCard count={4} />
        ) : filteredPlans.length === 0 ? (
          <p className="library-empty">Keine Pläne gefunden.</p>
        ) : (
          <div className="library-list">
            {filteredPlans.map((plan) => (
              <div key={plan.id} className="card library-card">
                <div className="library-card-header">
                  <div className="library-card-info">
                    <span className="library-card-name">{plan.name}</span>
                    {plan.description && <span className="library-card-meta">{plan.description}</span>}
                  </div>
                  {plan.is_system && <span className="plan-lib-badge">System</span>}
                </div>
                <div className="library-card-actions" style={{ marginTop: 8 }}>
                  <button className="library-action-btn" onClick={() => navigate(`/plans/${plan.id}`)}>
                    <Icon name="eye" size={14} /> Ansehen
                  </button>
                  <button className="library-action-btn library-action-btn--primary" onClick={() => copyPlan.mutate(plan.id)}>
                    <Icon name="copy" size={14} /> Kopieren
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

// --- Memoized Card ---

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
  return (
    <div
      className={`library-card card card--interactive ${isSelected ? 'library-card--selected' : ''}`}
      onClick={() => onSelect(ex)}
    >
      <div className="library-card-header">
        <div className="library-card-info">
          <span className="library-card-name">{ex.name}</span>
          <span className="library-card-meta">
            {ex.muscle_group && <span className="library-card-muscle">{ex.muscle_group}</span>}
            {ex.equipment.length > 0 && <span className="library-card-equipment">{ex.equipment.join(', ')}</span>}
            {(ex.usage_count ?? 0) > 0 && <span className="library-card-usage">{ex.usage_count}×</span>}
          </span>
        </div>
        <div className="library-card-actions-inline" onClick={(e) => e.stopPropagation()}>
          <button
            className={`library-icon-btn ${isFav ? 'library-icon-btn--fav' : ''}`}
            onClick={() => onToggleFav(ex, isFav)}
            aria-label={isFav ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
          >
            <Icon name="heart" size={16} />
          </button>
          <button
            className="library-icon-btn"
            onClick={() => onAddToPlan(ex)}
            aria-label="Zum Plan hinzufügen"
          >
            <Icon name="plus" size={16} />
          </button>
        </div>
        <span className={`library-card-cat library-card-cat--${ex.category}`}>
          {CATEGORY_LABELS[ex.category]}
        </span>
      </div>

      {isSelected && (
        <div className="library-card-expanded" onClick={(e) => e.stopPropagation()}>
          {ex.detail && <p className="library-card-detail">{ex.detail}</p>}
          {ex.howto && <p className="library-card-howto">{ex.howto}</p>}
          <div className="library-card-actions">
            <button className="library-action-btn library-action-btn--primary" onClick={() => onQuickStart(ex)}>
              <Icon name="play" size={14} /> Quick-Start
            </button>
            <button className="library-action-btn" onClick={() => onEdit(ex)}>
              <Icon name="edit" size={14} /> Bearbeiten
            </button>
            {ex.created_by && (
              <button className="library-action-btn library-action-btn--danger" onClick={() => onDelete(ex)}>
                <Icon name="trash" size={14} /> Löschen
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
