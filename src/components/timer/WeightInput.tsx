import { useState, useCallback } from 'react';
import { useSessionStore } from '../../stores/session-store.ts';
import type { LastWeight } from '../../hooks/useLastWeights.ts';
import '../../styles/weight-input.css';

interface WeightInputProps {
  stationIndex: number;
  roundNumber: number;
  lastWeight: LastWeight | undefined;
}

export function WeightInput({ stationIndex, roundNumber, lastWeight }: WeightInputProps) {
  const updateEntry = useSessionStore((s) => s.updateLastEntry);
  const [weight, setWeight] = useState<number | null>(null);
  const [reps, setReps] = useState<number | null>(null);
  const [accepted, setAccepted] = useState(false);

  const commit = useCallback((w: number | null, r: number | null) => {
    updateEntry(stationIndex, roundNumber, {
      weight_kg: w,
      reps: r,
    });
  }, [updateEntry, stationIndex, roundNumber]);

  function adjustWeight(delta: number) {
    const next = Math.max(0, (weight ?? 0) + delta);
    setWeight(next);
    commit(next, reps);
  }

  function adjustReps(delta: number) {
    const next = Math.max(0, (reps ?? 0) + delta);
    setReps(next);
    commit(weight, next);
  }

  function acceptSuggestion() {
    if (!lastWeight) return;
    setWeight(lastWeight.weight_kg);
    setReps(lastWeight.reps);
    setAccepted(true);
    commit(lastWeight.weight_kg, lastWeight.reps);
  }

  return (
    <div className="weight-input">
      {lastWeight && !accepted && !weight && (
        <button className="weight-suggestion" onClick={acceptSuggestion}>
          Zuletzt: {lastWeight.weight_kg} kg{lastWeight.reps != null ? ` × ${lastWeight.reps}` : ''}
        </button>
      )}

      <div className="weight-input-row">
        <div className="weight-stepper">
          <button className="weight-stepper-btn" onClick={() => adjustWeight(-0.5)} aria-label="Weniger Gewicht">−</button>
          <span className="weight-stepper-value">{weight ?? '–'}</span>
          <span className="weight-stepper-unit">kg</span>
          <button className="weight-stepper-btn" onClick={() => adjustWeight(0.5)} aria-label="Mehr Gewicht">+</button>
        </div>

        <div className="weight-stepper">
          <button className="weight-stepper-btn" onClick={() => adjustReps(-1)} aria-label="Weniger Wdh.">−</button>
          <span className="weight-stepper-value">{reps ?? '–'}</span>
          <span className="weight-stepper-unit">Wdh</span>
          <button className="weight-stepper-btn" onClick={() => adjustReps(1)} aria-label="Mehr Wdh.">+</button>
        </div>
      </div>
    </div>
  );
}
