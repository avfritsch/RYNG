import { useState } from 'react';
import { useExerciseLibrary } from '../../hooks/useExerciseLibrary.ts';
import { CATEGORY_LABELS, MUSCLE_GROUP_OPTIONS, EQUIPMENT_OPTIONS, type ExerciseCategory } from '../../types/exercise-library.ts';
import { useFocusTrap } from '../../hooks/useFocusTrap.ts';
import { Icon } from '../ui/Icon.tsx';
import '../../styles/library-picker.css';

interface QuickLibraryPickerProps {
  onAdd: (exercise: { name: string; howto?: string | null; isWarmup: boolean; workSeconds: number; pauseSeconds: number }) => void;
  onClose: () => void;
}

const allCategories: ExerciseCategory[] = ['warmup', 'strength', 'core', 'cardio', 'stretch'];

export function QuickLibraryPicker({ onAdd, onClose }: QuickLibraryPickerProps) {
  const trapRef = useFocusTrap<HTMLDivElement>();
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState<ExerciseCategory[]>([]);
  const [muscleGroups, setMuscleGroups] = useState<string[]>([]);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [showMuscle, setShowMuscle] = useState(false);
  const [showEquipment, setShowEquipment] = useState(false);

  const { data: exercises, isLoading } = useExerciseLibrary({
    categories: categories.length > 0 ? categories : undefined,
    muscleGroups: muscleGroups.length > 0 ? muscleGroups : undefined,
    equipment: equipment.length > 0 ? equipment : undefined,
    search: search || undefined,
  });

  function toggle<T>(arr: T[], val: T, setter: (v: T[]) => void) {
    setter(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
  }

  function handleSelect(ex: NonNullable<typeof exercises>[number]) {
    const isWarmup = ex.category === 'warmup' || ex.category === 'stretch';
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

        <div className="picker-filters">
          <div className="picker-categories">
            {allCategories.map((cat) => (
              <button
                key={cat}
                className={`library-chip library-chip--sm ${categories.includes(cat) ? 'library-chip--active' : ''}`}
                onClick={() => toggle(categories, cat, setCategories)}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>

          <button className="picker-filter-toggle" onClick={() => setShowMuscle(!showMuscle)}>
            <span>Muskelgruppe</span>
            {muscleGroups.length > 0 && <span className="library-filter-tag">{muscleGroups.length}</span>}
            <Icon name={showMuscle ? 'chevron-up' : 'chevron-down'} size={14} />
          </button>
          {showMuscle && (
            <div className="picker-categories">
              {MUSCLE_GROUP_OPTIONS.map((mg) => (
                <button
                  key={mg}
                  className={`library-chip library-chip--sm ${muscleGroups.includes(mg) ? 'library-chip--active' : ''}`}
                  onClick={() => toggle(muscleGroups, mg, setMuscleGroups)}
                >
                  {mg}
                </button>
              ))}
            </div>
          )}

          <button className="picker-filter-toggle" onClick={() => setShowEquipment(!showEquipment)}>
            <span>Equipment</span>
            {equipment.length > 0 && <span className="library-filter-tag">{equipment.length}</span>}
            <Icon name={showEquipment ? 'chevron-up' : 'chevron-down'} size={14} />
          </button>
          {showEquipment && (
            <div className="picker-categories">
              {EQUIPMENT_OPTIONS.map((eq) => (
                <button
                  key={eq}
                  className={`library-chip library-chip--sm ${equipment.includes(eq) ? 'library-chip--active' : ''}`}
                  onClick={() => toggle(equipment, eq, setEquipment)}
                >
                  {eq}
                </button>
              ))}
            </div>
          )}
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
                    {ex.muscle_groups?.length > 0 && <span>{ex.muscle_groups.join(', ')}</span>}
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
