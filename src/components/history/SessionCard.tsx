import type { Session } from '../../types/session.ts';
import '../../styles/session-card.css';

interface SessionCardProps {
  session: Session;
  onClick: () => void;
}

export function SessionCard({ session, onClick }: SessionCardProps) {
  const date = new Date(session.started_at);
  const dateStr = date.toLocaleDateString('de-DE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const timeStr = date.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const min = Math.floor(session.duration_sec / 60);
  const sec = session.duration_sec % 60;
  const durationStr = `${min}:${sec.toString().padStart(2, '0')}`;

  return (
    <button className="card card--interactive session-card" onClick={onClick}>
      <div className="session-card-date">
        <span className="session-card-day">{dateStr}</span>
        <span className="session-card-time">{timeStr}</span>
      </div>
      <div className="session-card-stats">
        <span className="session-card-stat">
          <strong>{durationStr}</strong> Dauer
        </span>
        <span className="session-card-stat">
          <strong>{session.rounds}</strong> Runden
        </span>
        <span className="session-card-stat">
          <strong>{session.station_count}</strong> Stationen
        </span>
      </div>
    </button>
  );
}
