import { useState } from 'react';
import { useExerciseLibrary, useCopyToplan } from '../../hooks/useExerciseLibrary.ts';
import { CATEGORY_LABELS, type ExerciseCategory } from '../../types/exercise-library.ts';
import { Icon } from '../ui/Icon.tsx';
import { useFocusTrap } from '../../hooks/useFocusTrap.ts';
import '../../styles/library-picker.css';

interface LibraryPickerProps {
  dayId: string;
  currentCount: number;
  isWarmup: boolean;
  onClose: () => void;
}

export function LibraryPicker({ dayId, currentCount, isWarmup, onClose }: LibraryPickerProps) {
  const trapRef = useFocusTrap<HTMLDivElement>();
  const [category, setCategory] = useState<ExerciseCategory | ''>('');
  const [search, setSearch] = useState('');
  const { data: exercises, isLoading } = useExerciseLibrary({
    categories: category ? [category] : undefined,
    search: search || undefined,
  });
  const copyToPlan = useCopyToplan();

  function handleAdd(ex: typeof exercises extends (infer T)[] | undefined ? T : never) {
    if (!ex) return;
    copyToPlan.mutate({
      exercise: ex,
      dayId,
      sortOrder: currentCount,
      isWarmup,
      workSeconds: isWarmup ? 30 : 45,
      pauseSeconds: isWarmup ? 10 : 30,
    });
  }

  return (
    <div className="picker-overlay" onClick={onClose}>
      <div ref={trapRef} className="picker-modal" role="dialog" aria-modal="true" aria-label="Übung aus Bibliothek hinzufügen" onClick={(e) => e.stopPropagation()}>
        <div className="picker-header">
          <h3>Übung aus Bibliothek</h3>
          <button className="picker-close" onClick={onClose} aria-label="Schließen">
            <Icon name="x-close" size={18} />
          </button>
        </div>

        <div className="picker-search">
          <Icon name="search" size={16} />
          <input
            className="picker-search-input"
            placeholder="Suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Übung suchen"
            autoFocus
          />
        </div>

        <div className="picker-cats">
          <button
            className={`picker-cat ${!category ? 'picker-cat--active' : ''}`}
            onClick={() => setCategory('')}
          >
            Alle
          </button>
          {(Object.keys(CATEGORY_LABELS) as ExerciseCategory[]).map((cat) => (
            <button
              key={cat}
              className={`picker-cat ${category === cat ? 'picker-cat--active' : ''}`}
              onClick={() => setCategory(cat)}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        <div className="picker-list">
          {isLoading ? (
            <p className="picker-empty">Laden...</p>
          ) : exercises?.length === 0 ? (
            <p className="picker-empty">Keine Übungen gefunden</p>
          ) : (
            exercises?.map((ex) => (
              <button
                key={ex.id}
                className="picker-item"
                onClick={() => handleAdd(ex)}
                disabled={copyToPlan.isPending}
              >
                <div className="picker-item-info">
                  <span className="picker-item-name">{ex.name}</span>
                  <span className="picker-item-meta">
                    {ex.muscle_groups?.length > 0 && `${ex.muscle_groups.join(', ')} · `}
                    {ex.equipment.join(', ')}
                  </span>
                </div>
                <Icon name="plus" size={18} />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
