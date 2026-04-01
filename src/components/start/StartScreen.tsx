import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSuggestions, type Suggestion } from '../../hooks/useSuggestions.ts';
import { useTimerStore } from '../../stores/timer-store.ts';
import { useSessionStore } from '../../stores/session-store.ts';
import { useGymStore, type GymExercise } from '../../stores/gym-store.ts';
import { usePlans, usePlanDays } from '../../hooks/usePlans.ts';
import { unlockAudio } from '../../lib/timer-engine.ts';
import { Icon } from '../ui/Icon.tsx';
import { SkeletonCard } from '../ui/SkeletonCard.tsx';
import type { TimerConfig, StationConfig } from '../../types/timer.ts';
import type { PlanExercise } from '../../types/plan.ts';
import { supabase } from '../../lib/supabase.ts';
import '../../styles/start-screen.css';

type StartMode = 'circuit' | 'gym';

export function StartScreen() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<StartMode>('circuit');
  const { suggestions, isLoading } = useSuggestions();
  const timerPhase = useTimerStore((s) => s.state.phase);
  const loadConfig = useTimerStore((s) => s.loadConfig);
  const startTimer = useTimerStore((s) => s.start);
  const startSession = useSessionStore((s) => s.start);
  const gymActive = useGymStore((s) => s.isActive);
  const startGym = useGymStore((s) => s.start);

  // Gym mode: plan/day selection
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const { data: plans } = usePlans();
  const { data: days } = usePlanDays(selectedPlanId ?? undefined);

  if (timerPhase !== 'idle' && timerPhase !== 'done') return null;
  if (gymActive) return null;

  async function handleStartDay(dayId: string) {
    const [{ data: exercises }, { data: day }] = await Promise.all([
      supabase
        .from('plan_exercises')
        .select('*')
        .eq('day_id', dayId)
        .order('sort_order'),
      supabase
        .from('plan_days')
        .select('*')
        .eq('id', dayId)
        .single(),
    ]);

    if (!exercises || exercises.length === 0) return;

    const stations: StationConfig[] = exercises.map((e: PlanExercise) => ({
      name: e.name,
      speechName: e.speech_name ?? undefined,
      workSeconds: e.work_seconds,
      pauseSeconds: e.pause_seconds,
      isWarmup: e.is_warmup,
      howto: e.howto ?? '',
      illustrationKey: e.illustration_key ?? undefined,
      trackWeight: e.track_weight ?? false,
    }));

    const config: TimerConfig = {
      stations,
      rounds: day?.rounds ?? 3,
      roundPause: day?.round_pause ?? 90,
    };

    unlockAudio();
    loadConfig(config);
    startSession();
    startTimer();
  }

  async function handleRepeatSession(sessionId: string) {
    const [{ data: entries }, { data: session }] = await Promise.all([
      supabase
        .from('session_entries')
        .select('*')
        .eq('session_id', sessionId)
        .order('round_number')
        .order('station_index'),
      supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single(),
    ]);

    if (!entries || entries.length === 0 || !session) return;

    // Deduplicate stations (entries have one per round)
    const seen = new Set<string>();
    const stations: StationConfig[] = [];
    for (const e of entries) {
      const key = `${e.station_index}-${e.station_name}`;
      if (!seen.has(key)) {
        seen.add(key);
        stations.push({
          name: e.station_name,
          workSeconds: e.work_seconds,
          pauseSeconds: 30,
          isWarmup: e.is_warmup,
          howto: '',
        });
      }
    }

    const config: TimerConfig = {
      stations,
      rounds: session.rounds,
      roundPause: 90,
    };

    unlockAudio();
    loadConfig(config);
    startSession();
    startTimer();
  }

  async function handleStartGymDay(dayId: string) {
    const { data: exercises } = await supabase
      .from('plan_exercises')
      .select('*')
      .eq('day_id', dayId)
      .order('sort_order');

    if (!exercises || exercises.length === 0) return;

    const gymExercises: GymExercise[] = exercises
      .filter((e: PlanExercise) => !e.is_warmup)
      .map((e: PlanExercise) => ({
        name: e.name,
        speechName: e.speech_name ?? undefined,
        illustrationKey: e.illustration_key ?? undefined,
        sets: [
          { weight_kg: null, reps: null, done: false },
          { weight_kg: null, reps: null, done: false },
          { weight_kg: null, reps: null, done: false },
        ],
        restSeconds: e.pause_seconds || 90,
        isWarmup: false,
        trackWeight: e.track_weight ?? false,
      }));

    if (gymExercises.length === 0) return;
    startGym(gymExercises);
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
      <h2 className="start-title">Bereit?</h2>

      {/* Mode toggle */}
      <div className="start-mode-toggle">
        <button
          className={`start-mode-btn ${mode === 'circuit' ? 'start-mode-btn--active' : ''}`}
          onClick={() => setMode('circuit')}
        >
          Zirkel
        </button>
        <button
          className={`start-mode-btn ${mode === 'gym' ? 'start-mode-btn--active' : ''}`}
          onClick={() => setMode('gym')}
        >
          Gym
        </button>
      </div>

      {/* Circuit mode */}
      {mode === 'circuit' && (
        <>
          {isLoading ? (
            <SkeletonCard count={3} />
          ) : (
            <div className="start-suggestions">
              {suggestions.map((s, i) => (
                <button
                  key={`${s.type}-${i}`}
                  className={`start-card card card--interactive ${i === 0 ? 'start-card--primary' : ''}`}
                  onClick={() => handleSuggestionAction(s)}
                >
                  <div className="start-card-content">
                    <span className="start-card-title">{s.title}</span>
                    <span className="start-card-desc">{s.description}</span>
                  </div>
                  <div className="start-card-action">
                    {s.type === 'create' || s.type === 'get-started' ? (
                      <Icon name="plus" size={20} />
                    ) : s.type === 'random' ? (
                      <Icon name="refresh" size={20} />
                    ) : s.type === 'repeat' || s.type === 'repeat-week' ? (
                      <Icon name="repeat" size={20} />
                    ) : (
                      <Icon name="play" size={20} />
                    )}
                  </div>
                </button>
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
                  </div>
                  <div className="start-card-action">
                    <Icon name="play" size={20} />
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
