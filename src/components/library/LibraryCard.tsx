import { memo } from 'react';
import { CATEGORY_LABELS, type LibraryExercise } from '../../types/exercise-library.ts';
import { Icon } from '../ui/Icon.tsx';
import { ExerciseIllustration } from '../ui/ExerciseIllustration.tsx';

/** Compact, expandable exercise row in the library list. */
export const LibraryCard = memo(function LibraryCard({
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
    <div className={`library-row ${isSelected ? 'library-row--selected' : ''}`} onClick={() => onSelect(ex)}>
      <div className="library-row-line1">
        <span className="library-row-name">{ex.name}</span>
        <span className={`library-row-cat library-row-cat--${ex.category}`}>{CATEGORY_LABELS[ex.category]}</span>
      </div>
      <div className="library-row-line2">
        <span className="library-row-meta">{metaParts.join(' · ')}</span>
        <div className="library-row-icons" onClick={(e) => e.stopPropagation()}>
          <button
            className={`library-row-icon ${isFav ? 'library-row-icon--fav' : ''}`}
            onClick={() => onToggleFav(ex, isFav)}
            aria-label={isFav ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
          >
            <Icon name="heart" size={16} />
          </button>
          <button className="library-row-icon" onClick={() => onAddToPlan(ex)} aria-label="Zum Plan hinzufügen">
            <Icon name="plus" size={16} />
          </button>
        </div>
      </div>

      {isSelected && (
        <div className="library-row-expanded" onClick={(e) => e.stopPropagation()}>
          <ExerciseIllustration illustrationKey={ex.illustration_key} size="preview" />
          {ex.howto && <p className="library-row-howto">{ex.howto}</p>}
          <div className="library-row-actions">
            <button
              className="library-action-btn library-action-btn--primary library-action-btn--sm"
              onClick={() => onQuickStart(ex)}
            >
              <Icon name="play" size={14} /> Quick-Start
            </button>
            <button className="library-action-btn library-action-btn--sm" onClick={() => onEdit(ex)}>
              <Icon name="edit" size={14} /> Bearbeiten
            </button>
            {ex.created_by && (
              <button
                className="library-action-btn library-action-btn--danger library-action-btn--sm"
                onClick={() => onDelete(ex)}
              >
                <Icon name="trash" size={14} /> Löschen
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
