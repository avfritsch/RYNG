import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlans, usePlanDays, usePlanExercises } from '../../hooks/usePlans.ts';
import { usePublishPlan } from '../../hooks/usePlanLibrary.ts';
import { useNavigationStore } from '../../stores/navigation-store.ts';
import { ExerciseCard } from './ExerciseCard.tsx';
import { ShareModal } from '../ui/ShareModal.tsx';
import { Icon } from '../ui/Icon.tsx';
import type { TimerConfig, StationConfig } from '../../types/timer.ts';
import type { PlanExercise } from '../../types/plan.ts';
import '../../styles/plan-detail.css';

export function PlanDetailScreen() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { data: plans } = usePlans();
  const { data: days, isLoading: daysLoading } = usePlanDays(planId);
  const [showShare, setShowShare] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const publishPlan = usePublishPlan();
  const setPendingConfig = useNavigationStore((s) => s.setPendingConfig);

  const plan = plans?.find((p) => p.id === planId);
  const selectedDay = days?.[selectedDayIndex];

  const { data: exercises, isLoading: exercisesLoading } = usePlanExercises(selectedDay?.id);

  if (!plan) {
    return <div className="plan-detail-loading">Plan wird geladen...</div>;
  }

  function loadWorkout() {
    if (!selectedDay || !exercises) return;

    const stations: StationConfig[] = exercises.map((ex: PlanExercise) => ({
      name: ex.name,
      workSeconds: ex.work_seconds,
      pauseSeconds: ex.pause_seconds,
      isWarmup: ex.is_warmup,
      howto: ex.detail ?? '',
    }));

    const config: TimerConfig = {
      stations,
      rounds: selectedDay.rounds,
      roundPause: selectedDay.round_pause,
    };

    setPendingConfig(config);
    navigate('/');
  }

  const warmupExercises = exercises?.filter((e) => e.is_warmup) ?? [];
  const kraftExercises = exercises?.filter((e) => !e.is_warmup) ?? [];

  return (
    <div className="plan-detail">
      <div className="plan-detail-header">
        <button className="plan-detail-back" onClick={() => navigate('/plans')}>
          &larr; Zurück
        </button>
        <h2 className="plan-detail-title">{plan.name}</h2>
        {plan.description && (
          <p className="plan-detail-desc">{plan.description}</p>
        )}
      </div>

      {daysLoading ? (
        <p className="plan-detail-loading">Tage laden...</p>
      ) : days && days.length > 0 ? (
        <>
          {days.length > 1 && (
            <div className="plan-day-tabs">
              {days.map((day, i) => (
                <button
                  key={day.id}
                  className={`plan-day-tab ${i === selectedDayIndex ? 'plan-day-tab--active' : ''}`}
                  onClick={() => setSelectedDayIndex(i)}
                >
                  {day.label}
                  {day.focus && <span className="plan-day-focus">{day.focus}</span>}
                </button>
              ))}
            </div>
          )}

          {selectedDay && (
            <div className="plan-day-info">
              <span>{selectedDay.rounds} Runden</span>
              <span>{selectedDay.round_pause}s Rundenpause</span>
            </div>
          )}

          {exercisesLoading ? (
            <p className="plan-detail-loading">Übungen laden...</p>
          ) : (
            <>
              {warmupExercises.length > 0 && (
                <section className="plan-exercise-section">
                  <h3 className="plan-exercise-section-label">Aufwärmen</h3>
                  <div className="plan-exercise-list">
                    {warmupExercises.map((ex, i) => (
                      <ExerciseCard key={ex.id} exercise={ex} index={i} />
                    ))}
                  </div>
                </section>
              )}

              {kraftExercises.length > 0 && (
                <section className="plan-exercise-section">
                  <h3 className="plan-exercise-section-label">Kraft</h3>
                  <div className="plan-exercise-list">
                    {kraftExercises.map((ex, i) => (
                      <ExerciseCard key={ex.id} exercise={ex} index={i} />
                    ))}
                  </div>
                </section>
              )}

              <div className="plan-detail-actions">
                <button className="plan-load-btn" onClick={loadWorkout}>
                  WORKOUT LADEN
                </button>
                <div className="plan-detail-row">
                  {exercises && exercises.length > 0 && selectedDay && (
                    <button
                      className="plan-share-btn"
                      onClick={() => setShowShare(true)}
                    >
                      <Icon name="share" size={16} /> TEILEN
                    </button>
                  )}
                  {!plan.is_system && (
                    <button
                      className="plan-edit-btn"
                      onClick={() => navigate(`/plans/${plan.id}/edit`)}
                    >
                      BEARBEITEN
                    </button>
                  )}
                  {!plan.is_system && (
                    <button
                      className="plan-share-btn"
                      onClick={() => publishPlan.mutate({ planId: plan.id, isPublic: !plan.is_public })}
                    >
                      <Icon name={plan.is_public ? 'eye-off' : 'eye'} size={16} />
                      {plan.is_public ? 'PRIVAT' : 'VERÖFFENTLICHEN'}
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      ) : (
        <p className="plan-detail-loading">Keine Tage in diesem Plan.</p>
      )}
      {showShare && exercises && selectedDay && (
        <ShareModal
          name={`${plan.name} — ${selectedDay.label}`}
          config={{
            rounds: selectedDay.rounds,
            roundPause: selectedDay.round_pause,
            stations: exercises.map((ex: PlanExercise) => ({
              name: ex.name,
              workSeconds: ex.work_seconds,
              pauseSeconds: ex.pause_seconds,
              isWarmup: ex.is_warmup,
              howto: ex.detail ?? '',
            })),
          }}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}
