import { useNavigate } from 'react-router-dom';
import { useSuggestions, type Suggestion } from '../../hooks/useSuggestions.ts';
import { useTimerStore } from '../../stores/timer-store.ts';
import { useSessionStore } from '../../stores/session-store.ts';
import { unlockAudio } from '../../lib/timer-engine.ts';
import { Icon } from '../ui/Icon.tsx';
import { SkeletonCard } from '../ui/SkeletonCard.tsx';
import type { TimerConfig, StationConfig } from '../../types/timer.ts';
import type { PlanExercise } from '../../types/plan.ts';
import { supabase } from '../../lib/supabase.ts';
import '../../styles/start-screen.css';

export function StartScreen() {
  const navigate = useNavigate();
  const { suggestions, isLoading } = useSuggestions();
  const timerPhase = useTimerStore((s) => s.state.phase);
  const loadConfig = useTimerStore((s) => s.loadConfig);
  const startTimer = useTimerStore((s) => s.start);
  const startSession = useSessionStore((s) => s.start);

  if (timerPhase !== 'idle' && timerPhase !== 'done') return null;

  async function handleStartDay(dayId: string) {
    const { data: exercises } = await supabase
      .from('plan_exercises')
      .select('*')
      .eq('day_id', dayId)
      .order('sort_order');

    if (!exercises || exercises.length === 0) return;

    const { data: day } = await supabase
      .from('plan_days')
      .select('*')
      .eq('id', dayId)
      .single();

    const stations: StationConfig[] = exercises.map((e: PlanExercise) => ({
      name: e.name,
      speechName: e.speech_name ?? undefined,
      workSeconds: e.work_seconds,
      pauseSeconds: e.pause_seconds,
      isWarmup: e.is_warmup,
      howto: e.howto ?? '',
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
    const { data: entries } = await supabase
      .from('session_entries')
      .select('*')
      .eq('session_id', sessionId)
      .order('round_number')
      .order('station_index');

    const { data: session } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

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
