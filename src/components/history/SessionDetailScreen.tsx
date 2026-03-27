import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession, useSessionEntries, useDeleteSession } from '../../hooks/useSessions.ts';
import { ConfirmModal } from '../ui/ConfirmModal.tsx';
import type { TimerConfig } from '../../types/timer.ts';
import '../../styles/session-detail.css';

export function SessionDetailScreen() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { data: session, isLoading } = useSession(sessionId);
  const { data: entries } = useSessionEntries(sessionId);
  const deleteSession = useDeleteSession();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (isLoading || !session) {
    return <div className="session-detail-loading">Session laden...</div>;
  }

  const date = new Date(session.started_at);
  const dateStr = date.toLocaleDateString('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const timeStr = date.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const min = Math.floor(session.duration_sec / 60);
  const sec = session.duration_sec % 60;
  const durationStr = `${min}:${sec.toString().padStart(2, '0')}`;

  function handleRepeat() {
    if (!entries || entries.length === 0 || !session) return;

    // Build a TimerConfig from the session entries
    const uniqueStations = new Map<number, typeof entries[0]>();
    for (const e of entries) {
      if (!uniqueStations.has(e.station_index)) {
        uniqueStations.set(e.station_index, e);
      }
    }

    const stations = Array.from(uniqueStations.values())
      .sort((a, b) => a.station_index - b.station_index)
      .map((e) => ({
        name: e.station_name,
        workSeconds: e.work_seconds,
        pauseSeconds: 30, // default, not stored in entries
        isWarmup: e.is_warmup,
        howto: '',
      }));

    const config: TimerConfig = {
      stations,
      rounds: session.rounds,
      roundPause: 90, // default
    };

    sessionStorage.setItem('ryng_loaded_config', JSON.stringify(config));
    navigate('/');
  }

  // Group entries by round
  const rounds = new Map<number, typeof entries>();
  for (const e of entries ?? []) {
    const arr = rounds.get(e.round_number) ?? [];
    arr.push(e);
    rounds.set(e.round_number, arr);
  }

  return (
    <div className="session-detail">
      <div className="session-detail-header">
        <button className="session-detail-back" onClick={() => navigate('/history')}>
          &larr; Zurück
        </button>
        <h2 className="session-detail-title">Session</h2>
        <p className="session-detail-date">{dateStr}, {timeStr}</p>
      </div>

      <div className="session-detail-stats">
        <div className="session-detail-stat">
          <span className="session-detail-stat-value">{durationStr}</span>
          <span className="session-detail-stat-label">Dauer</span>
        </div>
        <div className="session-detail-stat">
          <span className="session-detail-stat-value">{session.rounds}</span>
          <span className="session-detail-stat-label">Runden</span>
        </div>
        <div className="session-detail-stat">
          <span className="session-detail-stat-value">{session.station_count}</span>
          <span className="session-detail-stat-label">Stationen</span>
        </div>
      </div>

      {Array.from(rounds.entries()).map(([roundNum, roundEntries]) => (
        <section key={roundNum} className="session-round">
          <h3 className="session-round-label">Runde {roundNum}</h3>
          <div className="session-entries">
            {roundEntries?.map((entry, i) => (
              <div
                key={i}
                className={`session-entry ${entry.is_warmup ? 'session-entry--warmup' : ''}`}
              >
                <span className="session-entry-name">{entry.station_name}</span>
                <span className="session-entry-time">
                  {entry.actual_seconds ?? entry.work_seconds}s
                  {entry.actual_seconds && entry.actual_seconds < entry.work_seconds && (
                    <span className="session-entry-skipped"> (skip)</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </section>
      ))}

      <div className="session-detail-actions">
        <button className="session-repeat-btn" onClick={handleRepeat}>
          WIEDERHOLEN
        </button>
        <button className="session-delete-btn" onClick={() => setShowDeleteConfirm(true)}>
          LÖSCHEN
        </button>
      </div>

      {showDeleteConfirm && (
        <ConfirmModal
          title="Session löschen"
          message="Diese Session und alle zugehörigen Einträge werden unwiderruflich gelöscht."
          confirmLabel="Löschen"
          danger
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={() => {
            deleteSession.mutate(sessionId!, { onSuccess: () => navigate('/history') });
            setShowDeleteConfirm(false);
          }}
        />
      )}
    </div>
  );
}
