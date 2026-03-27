import { useState } from 'react';
import type { PlanExercise } from '../../types/plan.ts';
import { Icon } from '../ui/Icon.tsx';
import '../../styles/exercise-card.css';

interface ExerciseCardProps {
  exercise: PlanExercise;
  index: number;
}

export function ExerciseCard({ exercise, index }: ExerciseCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`card exercise-card ${exercise.is_warmup ? 'exercise-card--warmup' : ''}`}>
      <button className="exercise-card-header" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls={`exercise-body-${exercise.id}`}>
        <span className="exercise-card-index">{index + 1}</span>
        <div className="exercise-card-info">
          <span className="exercise-card-name">{exercise.name}</span>
          <span className="exercise-card-times">
            {exercise.work_seconds}s / {exercise.pause_seconds}s
            {exercise.muscle_group && <span className="exercise-card-muscle"> · {exercise.muscle_group}</span>}
          </span>
        </div>
        <span className={`exercise-card-chevron ${open ? 'exercise-card-chevron--open' : ''}`}>
          <Icon name="chevron-down" size={16} />
        </span>
      </button>
      {open && (
        <div className="exercise-card-body" id={`exercise-body-${exercise.id}`}>
          {exercise.detail && <p className="exercise-card-detail">{exercise.detail}</p>}
          {exercise.howto && <p className="exercise-card-howto">{exercise.howto}</p>}
          {!exercise.detail && !exercise.howto && (
            <p className="exercise-card-detail">Keine Details verfügbar.</p>
          )}
        </div>
      )}
    </div>
  );
}
