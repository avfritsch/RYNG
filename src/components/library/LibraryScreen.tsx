import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExerciseLibrary, useDeleteLibraryExercise } from '../../hooks/useExerciseLibrary.ts';
import { SEARCH_DEBOUNCE_MS } from '../../lib/constants.ts';
import { useFavorites, useToggleFavorite } from '../../hooks/useFavorites.ts';
import { useVotes, useToggleVote } from '../../hooks/useVotes.ts';
import { CATEGORY_LABELS, EQUIPMENT_OPTIONS, MUSCLE_GROUP_OPTIONS, type ExerciseCategory } from '../../types/exercise-library.ts';
import type { LibraryExercise } from '../../types/exercise-library.ts';
import type { TimerConfig } from '../../types/timer.ts';
import { ExerciseEditModal } from './ExerciseEditModal.tsx';
import { ConfirmModal } from '../ui/ConfirmModal.tsx';
import { Icon } from '../ui/Icon.tsx';
import { SkeletonCard } from '../ui/SkeletonCard.tsx';
import '../../styles/library.css';

const allCategories: ExerciseCategory[] = ['warmup', 'strength', 'core', 'cardio', 'stretch', 'mobility'];

export function LibraryScreen() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<ExerciseCategory[]>([]);
  const [equipmentSel, setEquipmentSel] = useState<string[]>([]);
  const [muscleGroups, setMuscleGroups] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [catOpen, setCatOpen] = useState(true);
  const [mgOpen, setMgOpen] = useState(false);
  const [eqOpen, setEqOpen] = useState(false);
  const [selected, setSelected] = useState<LibraryExercise | null>(null);
  const { data: favorites } = useFavorites();
  const toggleFavorite = useToggleFavorite();
  const { data: votes } = useVotes();
  const toggleVote = useToggleVote();
  const [editExercise, setEditExercise] = useState<LibraryExercise | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteExercise, setDeleteExercise] = useState<LibraryExercise | null>(null);
  const deleteLibExercise = useDeleteLibraryExercise();
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showOwnOnly, setShowOwnOnly] = useState(false);

  // Debounce search input
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  const { data: exercises, isLoading } = useExerciseLibrary({
    categories: categories.length > 0 ? categories : undefined,
    equipment: equipmentSel.length > 0 ? equipmentSel : undefined,
    muscleGroups: muscleGroups.length > 0 ? muscleGroups : undefined,
    search: debouncedSearch || undefined,
  });

  function toggleFilter<T>(arr: T[], val: T, setter: (v: T[]) => void) {
    setter(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
  }

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
    sessionStorage.setItem('ryng_loaded_config', JSON.stringify(config));
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

  const handleToggleVote = useCallback((ex: LibraryExercise, hasVoted: boolean) => {
    toggleVote.mutate({ exerciseId: ex.id, hasVoted });
  }, [toggleVote]);

  const handleDelete = useCallback((ex: LibraryExercise) => {
    setDeleteExercise(ex);
    setSelected(null);
  }, []);

  function handleAddToPlan(ex: LibraryExercise) {
    sessionStorage.setItem('ryng_add_exercise', JSON.stringify({
      name: ex.name,
      detail: ex.detail,
      muscle_group: ex.muscle_group,
      howto: ex.howto,
      category: ex.category,
      library_exercise_id: ex.id,
    }));
    navigate('/plans');
  }

  let filteredExercises = exercises;
  if (showFavoritesOnly && favorites) {
    filteredExercises = filteredExercises?.filter((ex) => favorites.has(ex.id));
  }
  if (showOwnOnly) {
    filteredExercises = filteredExercises?.filter((ex) => ex.created_by !== null);
  }

  return (
    <div className="library-screen">
      <div className="library-title-row">
        <h2 className="library-title">Übungsbibliothek</h2>
        <button className="library-create-btn" onClick={() => setShowCreate(true)}>
          <Icon name="plus" size={16} /> Neue Übung
        </button>
      </div>

      <div className="library-search">
        <Icon name="search" size={18} />
        <input
          className="library-search-input"
          placeholder="Übung suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button className="library-search-clear" onClick={() => setSearch('')}>
            <Icon name="x-close" size={14} />
          </button>
        )}
      </div>

      <div className="library-fav-toggle">
        <button
          className={`library-chip ${showFavoritesOnly ? 'library-chip--active' : ''}`}
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
        >
          <Icon name="heart" size={14} /> Favoriten
        </button>
        <button
          className={`library-chip ${showOwnOnly ? 'library-chip--active' : ''}`}
          onClick={() => setShowOwnOnly(!showOwnOnly)}
        >
          <Icon name="user" size={14} /> Eigene
        </button>
        <button className="library-chip" onClick={() => navigate('/library/plans')}>
          <Icon name="clipboard-list" size={14} /> Pläne
        </button>
      </div>

      <div className="library-filters">
        <button className="library-filter-header" onClick={() => setCatOpen(!catOpen)}>
          <span>Kategorie</span>
          {categories.length > 0 && <span className="library-filter-tag">{categories.length} aktiv</span>}
          <Icon name={catOpen ? 'chevron-up' : 'chevron-down'} size={16} />
        </button>
        {catOpen && (
          <div className="library-chip-wrap">
            {categories.length > 0 && (
              <button className="library-chip library-chip--reset" onClick={() => setCategories([])}>Zurücksetzen</button>
            )}
            {allCategories.map((cat) => (
              <button key={cat} className={`library-chip ${categories.includes(cat) ? 'library-chip--active' : ''}`} onClick={() => toggleFilter(categories, cat, setCategories)}>
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        )}

        <button className="library-filter-header" onClick={() => setMgOpen(!mgOpen)}>
          <span>Muskelgruppe</span>
          {muscleGroups.length > 0 && <span className="library-filter-tag">{muscleGroups.length} aktiv</span>}
          <Icon name={mgOpen ? 'chevron-up' : 'chevron-down'} size={16} />
        </button>
        {mgOpen && (
          <div className="library-chip-wrap">
            {muscleGroups.length > 0 && (
              <button className="library-chip library-chip--reset" onClick={() => setMuscleGroups([])}>Zurücksetzen</button>
            )}
            {MUSCLE_GROUP_OPTIONS.map((mg) => (
              <button key={mg} className={`library-chip ${muscleGroups.includes(mg) ? 'library-chip--active' : ''}`} onClick={() => toggleFilter(muscleGroups, mg, setMuscleGroups)}>
                {mg}
              </button>
            ))}
          </div>
        )}

        <button className="library-filter-header" onClick={() => setEqOpen(!eqOpen)}>
          <span>Equipment</span>
          {equipmentSel.length > 0 && <span className="library-filter-tag">{equipmentSel.length} aktiv</span>}
          <Icon name={eqOpen ? 'chevron-up' : 'chevron-down'} size={16} />
        </button>
        {eqOpen && (
          <div className="library-chip-wrap">
            {equipmentSel.length > 0 && (
              <button className="library-chip library-chip--reset" onClick={() => setEquipmentSel([])}>Zurücksetzen</button>
            )}
            {EQUIPMENT_OPTIONS.map((eq) => (
              <button key={eq} className={`library-chip ${equipmentSel.includes(eq) ? 'library-chip--active' : ''}`} onClick={() => toggleFilter(equipmentSel, eq, setEquipmentSel)}>
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
              hasVoted={votes?.has(ex.id) ?? false}
              isSelected={selected?.id === ex.id}
              onSelect={handleSelect}
              onToggleFav={handleToggleFav}
              onToggleVote={handleToggleVote}
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
    </div>
  );
}

// --- Memoized Card ---

const LibraryCard = memo(function LibraryCard({
  exercise: ex,
  isFav,
  hasVoted,
  isSelected,
  onSelect,
  onToggleFav,
  onToggleVote,
  onAddToPlan,
  onQuickStart,
  onEdit,
  onDelete,
}: {
  exercise: LibraryExercise;
  isFav: boolean;
  hasVoted: boolean;
  isSelected: boolean;
  onSelect: (ex: LibraryExercise) => void;
  onToggleFav: (ex: LibraryExercise, isFav: boolean) => void;
  onToggleVote: (ex: LibraryExercise, hasVoted: boolean) => void;
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
        <span className="library-card-name">{ex.name}</span>
        <span className={`library-card-cat library-card-cat--${ex.category}`}>
          {CATEGORY_LABELS[ex.category]}
        </span>
      </div>

      <div className="library-card-row2">
        <span className="library-card-detail">{ex.detail ?? ''}</span>
        <div className="library-card-inline-actions" onClick={(e) => e.stopPropagation()}>
          <button
            className={`library-icon-btn library-icon-btn--vote ${hasVoted ? 'library-icon-btn--voted' : ''}`}
            onClick={() => onToggleVote(ex, hasVoted)}
            aria-label={hasVoted ? 'Vote entfernen' : 'Upvote'}
          >
            <Icon name="thumbs-up" size={14} />
            {(ex.vote_count ?? 0) > 0 && <span className="library-vote-count">{ex.vote_count}</span>}
          </button>
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
      </div>

      <div className="library-card-meta">
        <span className={ex.created_by ? 'library-card-owner library-card-owner--own' : 'library-card-owner'}>
          {ex.created_by ? 'Eigene' : 'System'}
        </span>
        {ex.muscle_group && <span className="library-card-muscle">{ex.muscle_group}</span>}
        {ex.equipment.length > 0 && (
          <span className="library-card-equipment">{ex.equipment.join(', ')}</span>
        )}
      </div>

      {isSelected && (
        <div className="library-card-expanded" onClick={(e) => e.stopPropagation()}>
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
