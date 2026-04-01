import { useEffect, useRef, useCallback, useMemo, memo } from 'react';
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
import { useState } from 'react';
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

const GymSetRow = memo(function GymSetRow({ activeIndex, setIdx, set: s, trackWeight, updateSet, handleDoneSet }: GymSetRowProps) {
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
          onChange={(e) => updateSet(activeIndex, setIdx, { weight_kg: e.target.value ? Number(e.target.value) : null })}
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
        <Icon name={s.done ? 'check' : 'check'} size={16} />
      </button>
    </div>
  );
});

export function GymSessionScreen() {
  const isActive = useGymStore((s) => s.isActive);
  const exercises = useGymStore((s) => s.exercises);
  const activeIndex = useGymStore((s) => s.activeExerciseIndex);
  const startedAt = useGymStore((s) => s.startedAt);
  const restSeconds = useGymStore((s) => s.restSeconds);
  const restRunning = useGymStore((s) => s.restRunning);
  const setActiveExercise = useGymStore((s) => s.setActiveExercise);
  const addSet = useGymStore((s) => s.addSet);
  const updateSet = useGymStore((s) => s.updateSet);
  const markSetDone = useGymStore((s) => s.markSetDone);
  const startRest = useGymStore((s) => s.startRest);
  const clearRest = useGymStore((s) => s.clearRest);
  const tickRest = useGymStore((s) => s.tickRest);
  const finish = useGymStore((s) => s.finish);
  const resetGym = useGymStore((s) => s.reset);

  const saveSession = useSaveSession();
  const resetSession = useSessionStore((s) => s.reset);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isDone, setIsDone] = useState(false);

  // Last weights lookup — memoize so the array reference is stable for useLastWeights
  const exerciseNames = useMemo(
    () => exercises.filter((e) => e.trackWeight).map((e) => e.name),
    [exercises],
  );
  const { data: lastWeights } = useLastWeights(exerciseNames);

  // Rest timer interval
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (restRunning && restSeconds !== null && restSeconds > 0) {
      restRef.current = setInterval(() => {
        tickRest();
      }, 1000);
      return () => { if (restRef.current) clearInterval(restRef.current); };
    }
    if (restSeconds !== null && restSeconds <= 0) {
      beep(880, 200);
      clearRest();
    }
    return () => { if (restRef.current) clearInterval(restRef.current); };
  }, [restRunning, restSeconds, tickRest, clearRest]);

  // Beep at 3, 2, 1
  useEffect(() => {
    if (restSeconds !== null && restSeconds <= 3 && restSeconds > 0) {
      beep(660, 100);
    }
  }, [restSeconds]);

  const handleDoneSet = useCallback((exIdx: number, setIdx: number) => {
    markSetDone(exIdx, setIdx);
    const ex = exercises[exIdx];
    if (ex.restSeconds > 0) {
      startRest(ex.restSeconds);
    }
  }, [exercises, markSetDone, startRest]);

  function handleFinish() {
    if (!startedAt) return;
    const totalSeconds = Math.round((Date.now() - startedAt) / 1000);
    if (totalSeconds < 60) {
      // Too short, just reset
      resetGym();
      return;
    }

    // Build session entries from gym exercises
    const entries = exercises.flatMap((ex, exIdx) =>
      ex.sets.filter((s) => s.done).map((s, setIdx) => ({
        station_index: exIdx,
        station_name: ex.name,
        is_warmup: ex.isWarmup,
        work_seconds: 0,
        actual_seconds: 0,
        weight_kg: s.weight_kg,
        reps: s.reps,
        notes: null,
        round_number: setIdx + 1,
      })),
    );

    const now = new Date().toISOString();
    const doneSetCount = exercises.reduce((acc, ex) => acc + ex.sets.filter((s) => s.done).length, 0);

    saveSession.mutate({
      session: {
        started_at: new Date(startedAt).toISOString(),
        finished_at: now,
        duration_sec: totalSeconds,
        rounds: 1,
        station_count: doneSetCount,
        plan_day_id: null,
        mesocycle_week: null,
      },
      entries,
    }, {
      onSuccess: () => {
        beepDone();
        speakDone();
        setShowConfetti(true);
        setIsDone(true);
        finish();
      },
      onError: () => {
        toast.error('Session konnte nicht gespeichert werden.');
      },
    });
  }

  function handleClose() {
    setShowConfetti(false);
    setIsDone(false);
    resetGym();
    resetSession();
    saveSession.reset();
  }

  if (!isActive && !isDone) return null;

  const activeEx = exercises[activeIndex];
  const totalDone = exercises.reduce((acc, ex) => acc + ex.sets.filter((s) => s.done).length, 0);

  if (isDone) {
    const totalSeconds = startedAt ? Math.round((Date.now() - startedAt) / 1000) : 0;
    const min = Math.floor(totalSeconds / 60);
    const sec = totalSeconds % 60;
    return (
      <div className="gym-session">
        <Confetti active={showConfetti} />
        <div className="gym-done">
          <h1 className="gym-done-title">Training abgeschlossen!</h1>
          <div className="gym-done-stats">
            <div className="gym-done-stat">
              <span className="gym-done-stat-value">{exercises.length}</span>
              <span className="gym-done-stat-label">Übungen</span>
            </div>
            <div className="gym-done-stat">
              <span className="gym-done-stat-value">{totalDone}</span>
              <span className="gym-done-stat-label">Sätze</span>
            </div>
            <div className="gym-done-stat">
              <span className="gym-done-stat-value">{min}:{sec.toString().padStart(2, '0')}</span>
              <span className="gym-done-stat-label">Dauer</span>
            </div>
          </div>
          <button className="gym-done-btn" onClick={handleClose}>Fertig</button>
        </div>
      </div>
    );
  }

  return (
    <div className="gym-session">
      {/* Header */}
      <div className="gym-header">
        <button className="gym-header-btn" onClick={() => setShowConfirm(true)}>
          <Icon name="x-close" size={18} />
        </button>
        <span className="gym-header-title">Gym Training</span>
        <button className="gym-header-finish" onClick={handleFinish}>
          Beenden
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
              <span className="gym-tab-badge">{doneSets}/{ex.sets.length}</span>
            </button>
          );
        })}
      </div>

      {/* Rest timer overlay */}
      {restRunning && restSeconds !== null && (
        <div className="gym-rest">
          <span className="gym-rest-label">Pause</span>
          <span className="gym-rest-time">{restSeconds}</span>
          <button className="gym-rest-skip" onClick={clearRest}>Überspringen</button>
        </div>
      )}

      {/* Active exercise: set list */}
      {activeEx && (
        <div className="gym-exercise">
          <ExerciseIllustration illustrationKey={activeEx.illustrationKey} size="preview" />
          <h2 className="gym-exercise-name">{activeEx.name}</h2>

          {lastWeights?.has(activeEx.name) && (
            <p className="gym-exercise-last">
              Zuletzt: {lastWeights.get(activeEx.name)!.weight_kg} kg
              {lastWeights.get(activeEx.name)!.reps != null && ` × ${lastWeights.get(activeEx.name)!.reps}`}
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
          onConfirm={() => { resetGym(); setShowConfirm(false); }}
        />
      )}
    </div>
  );
}
