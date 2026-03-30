import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessions, type SessionFilter } from '../../hooks/useSessions.ts';
import { SessionCard } from './SessionCard.tsx';
import { TrainingCalendar } from './TrainingCalendar.tsx';
import { StatsPanel } from './StatsPanel.tsx';
import { StreakCounter } from './StreakCounter.tsx';
import { SkeletonCard } from '../ui/SkeletonCard.tsx';
import '../../styles/history-list.css';

const filters: { value: SessionFilter; label: string }[] = [
  { value: 'week', label: 'Woche' },
  { value: 'month', label: 'Monat' },
  { value: 'all', label: 'Alle' },
];

export function HistoryListScreen() {
  const [filter, setFilter] = useState<SessionFilter>('all');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const { data: sessions, isLoading, error } = useSessions(filter);
  const { data: allSessions } = useSessions('all');
  const navigate = useNavigate();

  function handleDayClick(dateKey: string) {
    setSelectedDay((prev) => prev === dateKey ? null : dateKey);
  }

  const displaySessions = useMemo(() => {
    if (!sessions) return [];
    if (!selectedDay) return sessions;
    return sessions.filter((s) => s.started_at.startsWith(selectedDay));
  }, [sessions, selectedDay]);

  return (
    <div className="history-list">
      <div className="history-title-row">
        <h2 className="history-title">Verlauf</h2>
        <StreakCounter sessions={allSessions ?? []} />
      </div>
      <TrainingCalendar sessions={allSessions ?? []} onDayClick={handleDayClick} />
      <StatsPanel sessions={allSessions ?? []} />

      <div className="history-filters">
        {selectedDay && (
          <button
            className="history-filter history-filter--active"
            onClick={() => setSelectedDay(null)}
          >
            {new Date(selectedDay).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })} ✕
          </button>
        )}
        {filters.map((f) => (
          <button
            key={f.value}
            className={`history-filter ${!selectedDay && filter === f.value ? 'history-filter--active' : ''}`}
            onClick={() => { setFilter(f.value); setSelectedDay(null); }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <SkeletonCard count={3} />
      )}

      {error && (
        <p style={{ color: 'var(--color-rest)', fontSize: 'var(--text-base)' }} role="alert">
          Fehler: {(error as Error).message}
        </p>
      )}

      {!isLoading && displaySessions.length === 0 && (
        <p className="history-empty">
          {selectedDay ? 'Keine Trainings an diesem Tag.' : 'Noch keine Sessions aufgezeichnet. Starte dein erstes Workout!'}
        </p>
      )}

      <div className="history-sessions">
        {displaySessions.map((session) => (
          <SessionCard
            key={session.id}
            session={session}
            onClick={() => navigate(`/history/${session.id}`)}
          />
        ))}
      </div>
    </div>
  );
}
