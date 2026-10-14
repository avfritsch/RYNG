import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useSuggestions, type Suggestion } from '../../hooks/useSuggestions.ts';
import { useTimerStore } from '../../stores/timer-store.ts';
import { useNavigationStore } from '../../stores/navigation-store.ts';
import { useGymStore } from '../../stores/gym-store.ts';
import { usePlans, usePlanDays } from '../../hooks/usePlans.ts';
import { loadPlanDayConfig, loadPlanDayGymExercises, loadSessionRepeatConfig } from '../../lib/workout-loader.ts';
import { toast } from '../../stores/toast-store.ts';
import { Icon } from '../ui/Icon.tsx';
import { SkeletonCard } from '../ui/SkeletonCard.tsx';
import { supabase } from '../../lib/supabase.ts';
import { WeeklyGoalRing } from '../ui/WeeklyGoalRing.tsx';
import { FeatureHint } from '../ui/FeatureHint.tsx';
import { useWeeklySessionCount } from '../../hooks/useWeeklySessionCount.ts';
import '../../styles/start-screen.css';

type StartMode = 'circuit' | 'gym';

export function StartScreen() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<StartMode>('circuit');
  const { suggestions, isLoading } = useSuggestions();
  const timerPhase = useTimerStore((s) => s.state.phase);
  const startWorkout = useTimerStore((s) => s.startWorkout);
  const [busy, setBusy] = useState(false);
  const gymActive = useGymStore((s) => s.isActive);
  const startGym = useGymStore((s) => s.start);
  const setPendingConfig = useNavigationStore((s) => s.setPendingConfig);
  const weeklySessionCount = useWeeklySessionCount();

  // Gym mode: plan/day selection
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const { data: plans } = usePlans();
  const { data: days } = usePlanDays(selectedPlanId ?? undefined);

  // Fetch exercises for all days of the selected plan (for preview)
  const dayIds = days?.map((d) => d.id) ?? [];
  const { data: dayExercisesMap } = useQuery({
    queryKey: ['plan-day-exercises-preview', selectedPlanId, dayIds],
    enabled: dayIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plan_exercises')
        .select('day_id, name, is_warmup')
        .in('day_id', dayIds)
        .order('sort_order');
      if (error) throw error;
      const map: Record<string, string[]> = {};
      for (const ex of data) {
        if (ex.is_warmup) continue;
        if (!map[ex.day_id]) map[ex.day_id] = [];
        map[ex.day_id].push(ex.name);
      }
      return map;
    },
  });

  if (timerPhase !== 'idle' && timerPhase !== 'done') return null;
  if (gymActive) return null;

  /** Run a loader, show a toast instead of silently doing nothing on failure. */
  async function withLoading<T>(load: () => Promise<T>): Promise<T | null> {
    if (busy) return null;
    setBusy(true);
    try {
      return await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Training konnte nicht geladen werden');
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function handleStartDay(dayId: string) {
    const config = await withLoading(() => loadPlanDayConfig(dayId));
    if (config) startWorkout(config);
  }

  async function handleRepeatSession(sessionId: string) {
    const config = await withLoading(() => loadSessionRepeatConfig(sessionId));
    if (config) startWorkout(config);
  }

  async function handleAdjustRepeat(sessionId: string) {
    const config = await withLoading(() => loadSessionRepeatConfig(sessionId));
    if (!config) return;
    setPendingConfig(config);
    navigate('/plans/quick');
  }

  async function handleStartGymDay(dayId: string) {
    const exercises = await withLoading(() => loadPlanDayGymExercises(dayId));
    if (exercises) startGym(exercises);
  }

  function handleSuggestionAction(s: Suggestion) {
    if ((s.type === 'next-day' || s.type === 'different' || s.type === 'random') && s.dayId) {
      handleStartDay(s.dayId);
    } else if ((s.type === 'repeat' || s.type === 'repeat-week') && s.sessionId) {
      handleRepeatSession(s.sessionId);
    } else if (s.type === 'create') {
      navigate('/plans/quick');
    } else if (s.type === 'get-started') {
      navigate('/plans');
    }
  }

  return (
    <div className="start-screen">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 className="start-title" style={{ marginBottom: 0 }}>Bereit?</h2>
        <WeeklyGoalRing weekCount={weeklySessionCount} />
      </div>

      {/* Mode toggle */}
      <div className="start-mode-toggle">
        <button
          className={`start-mode-btn ${mode === 'circuit' ? 'start-mode-btn--active' : ''}`}
          onClick={() => setMode('circuit')}
        >
          <span className="start-mode-label">Zirkel</span>
          <span className="start-mode-sub">Zeitbasiert mit Timer</span>
        </button>
        <button
          className={`start-mode-btn ${mode === 'gym' ? 'start-mode-btn--active' : ''}`}
          onClick={() => setMode('gym')}
        >
          <span className="start-mode-label">Gym</span>
          <span className="start-mode-sub">Sätze &amp; Gewichte</span>
        </button>
      </div>

      <FeatureHint hintId="mode-toggle">
        Zirkel = zeitbasiertes Intervalltraining. Gym = freies Training mit Sätzen und Gewichten.
      </FeatureHint>

      {/* Circuit mode */}
      {mode === 'circuit' && (
        <>
          {isLoading ? (
            <SkeletonCard count={3} />
          ) : (
            <div className="start-suggestions">
              {suggestions.map((s, i) => (
                <div key={`${s.type}-${i}`} className={`start-card-wrapper ${i === 0 ? 'start-card--primary' : ''}`}>
                  <button
                    className={`start-card card card--interactive ${i === 0 ? 'start-card--primary' : ''}`}
                    onClick={() => handleSuggestionAction(s)}
                  >
                    <div className="start-card-content">
                      <span className="start-card-title">{s.title}</span>
                      <span className="start-card-desc">{s.description}</span>
                    </div>
                    <div className="start-card-action">
                      <span className="start-card-action-icon">
                        {s.type === 'create' || s.type === 'get-started' ? (
                          <Icon name="plus" size={20} />
                        ) : s.type === 'random' ? (
                          <Icon name="refresh" size={20} />
                        ) : s.type === 'repeat' || s.type === 'repeat-week' ? (
                          <Icon name="repeat" size={20} />
                        ) : (
                          <Icon name="play" size={20} />
                        )}
                      </span>
                    </div>
                  </button>
                  {(s.type === 'repeat' || s.type === 'repeat-week') && s.sessionId && (
                    <button
                      className="start-card-adjust"
                      onClick={() => handleAdjustRepeat(s.sessionId!)}
                      aria-label="Anpassen & Starten"
                    >
                      <Icon name="settings" size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Gym mode */}
      {mode === 'gym' && (
        <div className="start-gym">
          <p className="start-gym-desc">Wähle einen Plan — du bestimmst das Tempo.</p>

          {!selectedPlanId ? (
            <div className="start-gym-plans">
              {plans?.filter((p) => !p.is_system).map((plan) => (
                <button
                  key={plan.id}
                  className="start-card card card--interactive"
                  onClick={() => setSelectedPlanId(plan.id)}
                >
                  <div className="start-card-content">
                    <span className="start-card-title">{plan.name}</span>
                    {plan.description && <span className="start-card-desc">{plan.description}</span>}
                  </div>
                  <Icon name="chevron-right" size={18} />
                </button>
              ))}
              {(!plans || plans.filter((p) => !p.is_system).length === 0) && (
                <p className="start-gym-empty">Erstelle zuerst einen Plan unter Pläne.</p>
              )}
            </div>
          ) : (
            <div className="start-gym-days">
              <button className="start-gym-back" onClick={() => setSelectedPlanId(null)}>
                &larr; Zurück
              </button>
              {days?.map((day) => (
                <button
                  key={day.id}
                  className="start-card card card--interactive start-card--primary"
                  onClick={() => handleStartGymDay(day.id)}
                >
                  <div className="start-card-content">
                    <span className="start-card-title">{day.label}</span>
                    {day.focus && <span className="start-card-desc">{day.focus}</span>}
                    {dayExercisesMap?.[day.id] && (
                      <span className="start-card-exercises">
                        {dayExercisesMap[day.id].join(' \u00b7 ')}
                      </span>
                    )}
                  </div>
                  <div className="start-card-action">
                    <span className="start-card-action-icon">
                      <Icon name="play" size={20} />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="start-quick-links">
        <button className="start-link" onClick={() => navigate('/plans')}>
          <Icon name="clipboard-list" size={16} />
          Alle Pläne
        </button>
        <button className="start-link" onClick={() => navigate('/history')}>
          <Icon name="bar-chart" size={16} />
          Verlauf
        </button>
      </div>
    </div>
  );
}
