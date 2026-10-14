import { useEffect, useRef, useCallback, useMemo, useState, memo } from 'react';
import { useGymStore } from '../../stores/gym-store.ts';
import { useLastWeights } from '../../hooks/useLastWeights.ts';
import { useSaveSession } from '../../hooks/useSessions.ts';
import { useSessionStore } from '../../stores/session-store.ts';
import { beep, beepDone } from '../../lib/timer-engine.ts';
import { toast } from '../../stores/toast-store.ts';
import { speakDone } from '../../lib/speech.ts';
import { Icon } from '../ui/Icon.tsx';
import { ExerciseIllustration } from '../ui/ExerciseIllustration.tsx';
import { Confetti } from '../ui/Confetti.tsx';
import { ConfirmModal } from '../ui/ConfirmModal.tsx';
import type { GymSet } from '../../stores/gym-store.ts';
import '../../styles/gym-session.css';

interface GymSetRowProps {
  activeIndex: number;
  setIdx: number;
  set: GymSet;
  trackWeight: boolean;
  updateSet: (exIdx: number, setIdx: number, patch: Partial<GymSet>) => void;
  handleDoneSet: (exIdx: number, setIdx: number) => void;
}

const GymSetRow = memo(function GymSetRow({
  activeIndex,
  setIdx,
  set: s,
  trackWeight,
  updateSet,
  handleDoneSet,
}: GymSetRowProps) {
  return (
    <div className={`gym-set-row ${s.done ? 'gym-set-row--done' : ''}`}>
      <span className="gym-sets-col gym-sets-col--num">{setIdx + 1}</span>

      {trackWeight && (
        <input
          className="gym-set-input"
          type="number"
          inputMode="decimal"
          step="0.5"
          value={s.weight_kg ?? ''}
          placeholder="–"
          onChange={(e) =>
            updateSet(activeIndex, setIdx, { weight_kg: e.target.value ? Number(e.target.value) : null })
          }
          disabled={s.done}
        />
      )}

      <input
        className="gym-set-input"
        type="number"
        inputMode="numeric"
        value={s.reps ?? ''}
        placeholder="–"
        onChange={(e) => updateSet(activeIndex, setIdx, { reps: e.target.value ? Number(e.target.value) : null })}
        disabled={s.done}
      />

      <button
        className={`gym-set-done-btn ${s.done ? 'gym-set-done-btn--checked' : ''}`}
        onClick={() => !s.done && handleDoneSet(activeIndex, setIdx)}
        disabled={s.done}
        aria-label={s.done ? 'Erledigt' : 'Satz abschließen'}
      >
        <Icon name="check" size={16} />
      </button>
    </div>
  );
});

export function GymSessionScreen() {
  const isActive = useGymStore((s) => s.isActive);
  const exercises = useGymStore((s) => s.exercises);
  const activeIndex = useGymStore((s) => s.activeExerciseIndex);
  const startedAt = useGymStore((s) => s.startedAt);
  const restEndsAt = useGymStore((s) => s.restEndsAt);
  const summary = useGymStore((s) => s.summary);
  const setActiveExercise = useGymStore((s) => s.setActiveExercise);
  const addSet = useGymStore((s) => s.addSet);
  const updateSet = useGymStore((s) => s.updateSet);
  const markSetDone = useGymStore((s) => s.markSetDone);
  const startRest = useGymStore((s) => s.startRest);
  const clearRest = useGymStore((s) => s.clearRest);
  const finish = useGymStore((s) => s.finish);
  const resetGym = useGymStore((s) => s.reset);

  const saveSession = useSaveSession();
  const resetSession = useSessionStore((s) => s.reset);
  const [showConfirm, setShowConfirm] = useState(false);

  // Last weights lookup — memoize so the array reference is stable for useLastWeights
  const exerciseNames = useMemo(
    () => exercises.filter((e) => e.trackWeight).map((e) => ({ name: e.name, libraryExerciseId: e.libraryExerciseId })),
    [exercises],
  );
  const { data: lastWeights } = useLastWeights(exerciseNames);

  // Rest countdown, derived from an absolute end time so it survives
  // backgrounding and reloads.
  const [now, setNow] = useState(() => Date.now());
  const lastBeepRef = useRef<number | null>(null);
  useEffect(() => {
    if (restEndsAt === null) return;
    const id = setInterval(() => {
      const t = Date.now();
      const left = Math.ceil((restEndsAt - t) / 1000);
      if (left <= 0) {
        if (left > -3) beep(880, 200);
        clearRest();
        return;
      }
      if (left <= 3 && lastBeepRef.current !== left) beep(660, 100);
      lastBeepRef.current = left;
      setNow(t);
    }, 250);
    return () => clearInterval(id);
  }, [restEndsAt, clearRest]);
  const restLeft = restEndsAt !== null ? Math.max(1, Math.ceil((restEndsAt - now) / 1000)) : null;

  // Stable callback (reads exercises from the store) so memoized rows don't re-render on every keystroke.
  const handleDoneSet = useCallback(
    (exIdx: number, setIdx: number) => {
      markSetDone(exIdx, setIdx);
      const ex = useGymStore.getState().exercises[exIdx];
      if (ex && ex.restSeconds > 0) {
        setNow(Date.now());
        startRest(ex.restSeconds);
      }
    },
    [markSetDone, startRest],
  );

  function handleFinish() {
    if (!startedAt || saveSession.isPending) return;
    const totalSeconds = Math.round((Date.now() - startedAt) / 1000);

    // One entry per completed set; round_number = set number
    const entries = exercises.flatMap((ex, exIdx) =>
      ex.sets
        .filter((s) => s.done)
        .map((s, setIdx) => ({
          station_index: exIdx,
          station_name: ex.name,
          is_warmup: ex.isWarmup,
          work_seconds: 0,
          actual_seconds: 0,
          weight_kg: s.weight_kg,
          reps: s.reps,
          notes: null,
          round_number: setIdx + 1,
          library_exercise_id: ex.libraryExerciseId ?? null,
        })),
    );

    if (entries.length === 0) {
      toast.info('Noch keine Sätze abgehakt — nichts gespeichert');
      resetGym();
      return;
    }

    const exercisesDone = new Set(entries.map((e) => e.station_index)).size;

    saveSession.mutate(
      {
        session: {
          started_at: new Date(startedAt).toISOString(),
          finished_at: new Date().toISOString(),
          duration_sec: totalSeconds,
          rounds: 1,
          station_count: exercisesDone,
          plan_day_id: null,
          mesocycle_week: null,
        },
        entries,
      },
      {
        onSuccess: () => {
          beepDone();
          speakDone();
          finish({ exercises: exercisesDone, sets: entries.length, totalSeconds });
        },
        onError: () => {
          toast.error('Session konnte nicht gespeichert werden. Bitte erneut versuchen.');
        },
      },
    );
  }

  function handleClose() {
    resetGym();
    resetSession();
    saveSession.reset();
  }

  if (!isActive) return null;

  if (summary) {
    const min = Math.floor(summary.totalSeconds / 60);
    const sec = summary.totalSeconds % 60;
    return (
      <div className="gym-session">
        <Confetti active />
        <div className="gym-done">
          <h1 className="gym-done-title">Training abgeschlossen!</h1>
          <div className="gym-done-stats">
            <div className="gym-done-stat">
              <span className="gym-done-stat-value">{summary.exercises}</span>
              <span className="gym-done-stat-label">Übungen</span>
            </div>
            <div className="gym-done-stat">
              <span className="gym-done-stat-value">{summary.sets}</span>
              <span className="gym-done-stat-label">Sätze</span>
            </div>
            <div className="gym-done-stat">
              <span className="gym-done-stat-value">
                {min}:{sec.toString().padStart(2, '0')}
              </span>
              <span className="gym-done-stat-label">Dauer</span>
            </div>
          </div>
          <button className="gym-done-btn" onClick={handleClose}>
            Fertig
          </button>
        </div>
      </div>
    );
  }

  const activeEx = exercises[activeIndex];
  const lastWeight = activeEx ? lastWeights?.get(activeEx) : undefined;
  return (
    <div className="gym-session">
      {/* Header */}
      <div className="gym-header">
        <button className="gym-header-btn" onClick={() => setShowConfirm(true)}>
          <Icon name="x-close" size={18} />
        </button>
        <span className="gym-header-title">Gym Training</span>
        <button className="gym-header-finish" onClick={handleFinish} disabled={saveSession.isPending}>
          {saveSession.isPending ? 'Speichern…' : 'Beenden'}
        </button>
      </div>

      {/* Exercise tabs */}
      <div className="gym-tabs">
        {exercises.map((ex, i) => {
          const doneSets = ex.sets.filter((s) => s.done).length;
          return (
            <button
              key={i}
              className={`gym-tab ${i === activeIndex ? 'gym-tab--active' : ''} ${doneSets === ex.sets.length && doneSets > 0 ? 'gym-tab--done' : ''}`}
              onClick={() => setActiveExercise(i)}
            >
              {ex.name.length > 12 ? ex.name.slice(0, 12) + '…' : ex.name}
              <span className="gym-tab-badge">
                {doneSets}/{ex.sets.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Rest timer overlay */}
      {restLeft !== null && (
        <div className="gym-rest">
          <span className="gym-rest-label">Pause</span>
          <span className="gym-rest-time">{restLeft}</span>
          <button className="gym-rest-skip" onClick={clearRest}>
            Überspringen
          </button>
        </div>
      )}

      {/* Active exercise: set list */}
      {activeEx && (
        <div className="gym-exercise">
          <ExerciseIllustration illustrationKey={activeEx.illustrationKey} size="preview" />
          <h2 className="gym-exercise-name">{activeEx.name}</h2>

          {lastWeight && (
            <p className="gym-exercise-last">
              Zuletzt: {lastWeight.weight_kg} kg
              {lastWeight.reps != null && ` × ${lastWeight.reps}`}
            </p>
          )}

          <div className="gym-sets-header">
            <span className="gym-sets-col gym-sets-col--num">Satz</span>
            {activeEx.trackWeight && <span className="gym-sets-col">kg</span>}
            <span className="gym-sets-col">Wdh.</span>
            <span className="gym-sets-col gym-sets-col--action" />
          </div>

          {activeEx.sets.map((s, setIdx) => (
            <GymSetRow
              key={setIdx}
              activeIndex={activeIndex}
              setIdx={setIdx}
              set={s}
              trackWeight={activeEx.trackWeight}
              updateSet={updateSet}
              handleDoneSet={handleDoneSet}
            />
          ))}

          <button className="gym-add-set" onClick={() => addSet(activeIndex)}>
            <Icon name="plus" size={14} /> Satz hinzufügen
          </button>
        </div>
      )}

      {showConfirm && (
        <ConfirmModal
          title="Training abbrechen?"
          message="Dein Fortschritt geht verloren."
          confirmLabel="Abbrechen"
          danger
          onCancel={() => setShowConfirm(false)}
          onConfirm={() => {
            resetGym();
            setShowConfirm(false);
          }}
        />
      )}
    </div>
  );
}
