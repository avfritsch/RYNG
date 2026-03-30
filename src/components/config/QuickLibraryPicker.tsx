import { useState } from 'react';
import { useExerciseLibrary } from '../../hooks/useExerciseLibrary.ts';
import { CATEGORY_LABELS, type ExerciseCategory } from '../../types/exercise-library.ts';
import { useFocusTrap } from '../../hooks/useFocusTrap.ts';
import { Icon } from '../ui/Icon.tsx';
import '../../styles/library-picker.css';

interface QuickLibraryPickerProps {
  onAdd: (exercise: { name: string; howto?: string | null; isWarmup: boolean; workSeconds: number; pauseSeconds: number }) => void;
  onClose: () => void;
}

export function QuickLibraryPicker({ onAdd, onClose }: QuickLibraryPickerProps) {
  const trapRef = useFocusTrap<HTMLDivElement>();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ExerciseCategory | ''>('');
  const { data: exercises, isLoading } = useExerciseLibrary({
    categories: category ? [category] : undefined,
    search: search || undefined,
  });

  function handleSelect(ex: NonNullable<typeof exercises>[number]) {
    const isWarmup = ex.category === 'warmup' || ex.category === 'stretch' || ex.category === 'mobility';
    onAdd({
      name: ex.name,
      howto: ex.howto,
      isWarmup,
      workSeconds: isWarmup ? 30 : 45,
      pauseSeconds: isWarmup ? 10 : 30,
    });
  }

  return (
    <div className="picker-overlay" onClick={onClose}>
      <div ref={trapRef} className="picker-modal" role="dialog" aria-modal="true" aria-label="Übung aus Bibliothek" onClick={(e) => e.stopPropagation()}>
        <div className="picker-header">
          <h3>Übung hinzufügen</h3>
          <button onClick={onClose} aria-label="Schließen">
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

        <div className="picker-categories">
          <button
            className={`library-chip ${!category ? 'library-chip--active' : ''}`}
            onClick={() => setCategory('')}
          >
            Alle
          </button>
          {(['warmup', 'strength', 'core', 'cardio'] as ExerciseCategory[]).map((cat) => (
            <button
              key={cat}
              className={`library-chip ${category === cat ? 'library-chip--active' : ''}`}
              onClick={() => setCategory(cat === category ? '' : cat)}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        <div className="picker-list">
          {isLoading ? (
            <p className="picker-loading">Laden...</p>
          ) : !exercises || exercises.length === 0 ? (
            <p className="picker-empty">Keine Übungen gefunden.</p>
          ) : (
            exercises.map((ex) => (
              <button
                key={ex.id}
                className="picker-item"
                onClick={() => handleSelect(ex)}
              >
                <div className="picker-item-info">
                  <span className="picker-item-name">{ex.name}</span>
                  <span className="picker-item-meta">
                    {ex.muscle_group && <span>{ex.muscle_group}</span>}
                    {ex.equipment.length > 0 && <span> · {ex.equipment.join(', ')}</span>}
                  </span>
                </div>
                <Icon name="plus" size={16} />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
