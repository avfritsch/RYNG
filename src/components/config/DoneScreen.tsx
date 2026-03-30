import { useEffect } from 'react';
import { useTimerStore } from '../../stores/timer-store.ts';
import { useSessionStore } from '../../stores/session-store.ts';
import { useSaveSession } from '../../hooks/useSessions.ts';
import { useNavigate } from 'react-router-dom';
import '../../styles/done-screen.css';

export function DoneScreen() {
  const state = useTimerStore((s) => s.state);
  const config = useTimerStore((s) => s.config);
  const lastSummary = useTimerStore((s) => s.lastSummary);
  const reset = useTimerStore((s) => s.reset);
  const sessionEntries = useSessionStore((s) => s.entries);
  const sessionStartedAt = useSessionStore((s) => s.startedAt);
  const resetSession = useSessionStore((s) => s.reset);
  const saveSession = useSaveSession();
  const navigate = useNavigate();

  // Auto-save session when done
  useEffect(() => {
    if (!lastSummary || !config) return;
    if (state.phase !== 'done' && state.phase !== 'idle') return;
    if (saveSession.isPending || saveSession.isSuccess) return;

    const now = new Date().toISOString();
    const startedAt = sessionStartedAt
      ? new Date(sessionStartedAt).toISOString()
      : new Date(Date.now() - lastSummary.totalSeconds * 1000).toISOString();

    saveSession.mutate({
      session: {
        user_id: '',
        started_at: startedAt,
        finished_at: now,
        duration_sec: lastSummary.totalSeconds,
        rounds: lastSummary.roundsDone,
        station_count: lastSummary.stationsDone,
        plan_day_id: null,
        mesocycle_week: null,
      },
      entries: sessionEntries,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastSummary, state.phase, config, sessionEntries, sessionStartedAt]);

  if (state.phase !== 'done' && !lastSummary) return null;
  if (state.phase !== 'done' && state.phase !== 'idle') return null;
  if (!lastSummary) return null;

  function formatDuration(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function handleAgain() {
    saveSession.reset();
    resetSession();
    reset();
  }

  function handleHistory() {
    saveSession.reset();
    resetSession();
    reset();
    navigate('/history');
  }

  return (
    <div className="done-screen">
      <div className="done-card">
        <h1 className="done-title">Fertig!</h1>

        <div className="done-stats">
          <div className="done-stat">
            <span className="done-stat-value">{lastSummary.roundsDone}</span>
            <span className="done-stat-label">Runden</span>
          </div>
          <div className="done-stat">
            <span className="done-stat-value">{lastSummary.stationsDone}</span>
            <span className="done-stat-label">Stationen</span>
          </div>
          <div className="done-stat">
            <span className="done-stat-value">{formatDuration(lastSummary.totalSeconds)}</span>
            <span className="done-stat-label">Dauer</span>
          </div>
        </div>

        {saveSession.isError && (
          <p style={{ color: 'var(--color-rest)', fontSize: '0.8125rem', marginBottom: 16 }}>
            Session konnte nicht gespeichert werden.
          </p>
        )}

        <div className="done-actions">
          <button className="done-btn done-btn--primary" onClick={handleAgain}>
            NOCHMAL
          </button>
          <button className="done-btn done-btn--secondary" onClick={handleHistory}>
            VERLAUF
          </button>
        </div>
      </div>
    </div>
  );
}
