import { useEffect, useMemo, useRef, useState } from 'react';
import { useTimerStore } from '../../stores/timer-store.ts';
import { useSessionStore } from '../../stores/session-store.ts';
import { useSaveSession, useSessions } from '../../hooks/useSessions.ts';
import { toast } from '../../stores/toast-store.ts';
import { useNavigate } from 'react-router-dom';
import { Confetti } from '../ui/Confetti.tsx';
import { getWeeklyGoal } from '../../lib/weekly-goal.ts';
import { useWeeklySessionCount } from '../../hooks/useWeeklySessionCount.ts';
import { useBadges } from '../../hooks/useBadges.ts';
import { calculateStreak } from '../../lib/streak.ts';
import { shareWorkoutCard } from '../../lib/share-card.ts';
import type { ShareCardData } from '../../lib/share-card.ts';
import '../../styles/done-screen.css';
import '../../styles/weekly-goal.css';
import '../../styles/badge-grid.css';

const MIN_DURATION_SEC = 60;

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
  const skippedRef = useRef(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const weeklyGoal = getWeeklyGoal();
  const weeklySessionCount = useWeeklySessionCount();
  const { newBadges, markAllSeen } = useBadges();
  const { data: allSessions } = useSessions('all');

  // Detect personal records by comparing current session against history
  const records = useMemo(() => {
    if (!lastSummary || !allSessions || !saveSession.isSuccess) return [];
    // Exclude the just-saved session (it's already in allSessions after invalidation)
    // Compare against previous sessions only
    const previous = allSessions.slice(1); // allSessions is sorted desc, [0] is the latest
    if (previous.length === 0) return [];

    const result: string[] = [];

    const prevMaxDuration = Math.max(...previous.map((s) => s.duration_sec));
    if (lastSummary.totalSeconds > prevMaxDuration) {
      result.push('Neuer Rekord: Längste Session!');
    }

    const prevMaxStations = Math.max(...previous.map((s) => s.station_count));
    const currentStations = lastSummary.stationsDone;
    if (currentStations > prevMaxStations) {
      result.push('Neuer Rekord: Meiste Übungen!');
    }

    const prevMaxRounds = Math.max(...previous.map((s) => s.rounds));
    if (lastSummary.roundsDone > prevMaxRounds) {
      result.push('Neuer Rekord: Meiste Runden!');
    }

    return result;
  }, [lastSummary, allSessions, saveSession.isSuccess]);

  // Calculate current streak
  const streak = useMemo(() => {
    if (!allSessions || !saveSession.isSuccess) return 0;
    return calculateStreak(allSessions);
  }, [allSessions, saveSession.isSuccess]);

  // Mark new badges as seen after displaying them
  useEffect(() => {
    if (saveSession.isSuccess && newBadges.length > 0) {
      const timer = setTimeout(() => markAllSeen(), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveSession.isSuccess, newBadges.length, markAllSeen]);

  // Auto-save session when done (skip if < 60s)
  useEffect(() => {
    if (!lastSummary || !config) return;
    if (state.phase !== 'done' && state.phase !== 'idle') return;
    if (saveSession.isPending || saveSession.isSuccess) return;
    if (skippedRef.current) return;

    const now = new Date().toISOString();
    const startedAt = sessionStartedAt
      ? new Date(sessionStartedAt).toISOString()
      : new Date(Date.now() - lastSummary.totalSeconds * 1000).toISOString();

    const sessionPayload = {
      session: {
        started_at: startedAt,
        finished_at: now,
        duration_sec: lastSummary.totalSeconds,
        rounds: lastSummary.roundsDone,
        station_count: lastSummary.stationsDone || new Set(sessionEntries.map((e) => e.station_name)).size,
        plan_day_id: null,
        mesocycle_week: null,
      },
      entries: sessionEntries,
    };

    if (lastSummary.totalSeconds < MIN_DURATION_SEC) {
      // Too short — don't save, but offer the option
      skippedRef.current = true;
      toast.undo('Training unter 1 Min — nicht gespeichert', () => {
        saveSession.mutate(sessionPayload);
      });
      return;
    }

    saveSession.mutate(sessionPayload);
    setShowConfetti(true);
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
    skippedRef.current = false;
    saveSession.reset();
    resetSession();
    reset();
  }

  function handleHistory() {
    skippedRef.current = false;
    saveSession.reset();
    resetSession();
    reset();
    navigate('/history');
  }

  function handleShare() {
    const now = new Date();
    const dateStr = now.toLocaleDateString('de-DE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const cardData: ShareCardData = {
      title: 'Training abgeschlossen!',
      duration: formatDuration(lastSummary!.totalSeconds),
      exercises: lastSummary!.stationsDone,
      rounds: lastSummary!.roundsDone,
      streak: streak > 1 ? streak : undefined,
      date: dateStr,
    };
    shareWorkoutCard(cardData).catch(() => {
      toast.error('Teilen fehlgeschlagen');
    });
  }

  return (
    <div className="done-screen">
      <Confetti active={showConfetti} />
      <div className="done-card">
        <h1 className="done-title">Training abgeschlossen!</h1>

        <div className="done-stats">
          <div className="done-stat">
            <span className="done-stat-value">{lastSummary.roundsDone}</span>
            <span className="done-stat-label">Runden</span>
          </div>
          <div className="done-stat">
            <span className="done-stat-value">{lastSummary.stationsDone}</span>
            <span className="done-stat-label">Übungen</span>
          </div>
          <div className="done-stat">
            <span className="done-stat-value">{formatDuration(lastSummary.totalSeconds)}</span>
            <span className="done-stat-label">Dauer</span>
          </div>
        </div>

        {weeklyGoal !== null && (
          weeklySessionCount >= weeklyGoal ? (
            <p className="done-weekly-goal done-weekly-goal--reached">
              Wochenziel erreicht! 🎉
            </p>
          ) : (
            <p className="done-weekly-goal">
              Wochenziel: {weeklySessionCount}/{weeklyGoal} Trainings
            </p>
          )
        )}

        {saveSession.isSuccess && newBadges.length > 0 && (
          <div className="done-new-badges">
            {newBadges.map((badge) => (
              <div key={badge.id} className="done-new-badge">
                <span className="done-new-badge-icon">{badge.icon}</span>
                <div className="done-new-badge-text">
                  <span className="done-new-badge-label">Neuer Erfolg!</span>
                  <span className="done-new-badge-name">{badge.name}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {records.length > 0 && (
          <div className="done-records">
            {records.map((r) => (
              <div key={r} className="done-record">
                <span className="done-record-icon">🏅</span>
                <span className="done-record-text">{r}</span>
              </div>
            ))}
          </div>
        )}

        {saveSession.isSuccess && streak > 0 && (
          <p className="done-streak">
            {streak === 1 ? 'Streak gestartet! 🔥' : `Streak: 🔥 ${streak} Tage`}
          </p>
        )}

        {saveSession.isError && (
          <p style={{ color: 'var(--color-rest)', fontSize: 'var(--text-sm)', marginBottom: 16 }}>
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
          <button className="done-btn done-btn--secondary" onClick={handleShare}>
            📤 TEILEN
          </button>
        </div>
      </div>
    </div>
  );
}
