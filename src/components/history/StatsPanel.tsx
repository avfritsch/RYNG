import { useMemo } from 'react';
import type { Session } from '../../types/session.ts';
import '../../styles/stats-panel.css';

interface StatsPanelProps {
  sessions: Session[];
}

interface WeekData {
  label: string;
  workouts: number;
  minutes: number;
}

export function StatsPanel({ sessions }: StatsPanelProps) {
  const stats = useMemo(() => computeStats(sessions), [sessions]);

  return (
    <div className="stats-panel">
      {/* Volume Trend — last 4 weeks */}
      <div className="stats-section">
        <h3 className="stats-section-title">Wöchentliches Volumen</h3>
        <div className="stats-bars">
          {stats.weeks.map((week, i) => (
            <div key={i} className="stats-bar-col">
              <div className="stats-bar-track">
                <div
                  className="stats-bar-fill"
                  style={{ height: `${stats.maxMinutes > 0 ? (week.minutes / stats.maxMinutes) * 100 : 0}%` }}
                />
              </div>
              <span className="stats-bar-value">{week.minutes}m</span>
              <span className="stats-bar-label">{week.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="stats-section">
        <h3 className="stats-section-title">Gesamt</h3>
        <div className="stats-totals">
          <div className="stats-total">
            <span className="stats-total-value">{stats.totalWorkouts}</span>
            <span className="stats-total-label">Workouts</span>
          </div>
          <div className="stats-total">
            <span className="stats-total-value">{formatHours(stats.totalMinutes)}</span>
            <span className="stats-total-label">Stunden</span>
          </div>
          <div className="stats-total">
            <span className="stats-total-value">{stats.avgDuration}</span>
            <span className="stats-total-label">Ø Min/Workout</span>
          </div>
          <div className="stats-total">
            <span className="stats-total-value">{stats.avgPerWeek.toFixed(1)}</span>
            <span className="stats-total-label">Ø/Woche</span>
          </div>
        </div>
      </div>

      {/* Personal Records */}
      {stats.records.length > 0 && (
        <div className="stats-section">
          <h3 className="stats-section-title">Persönliche Rekorde</h3>
          <div className="stats-records">
            {stats.records.map((r, i) => (
              <div key={i} className="stats-record">
                <span className="stats-record-label">{r.label}</span>
                <span className="stats-record-value">{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function computeStats(sessions: Session[]) {
  // Weekly volume (last 4 weeks)
  const now = new Date();
  const weeks: WeekData[] = [];
  for (let w = 3; w >= 0; w--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1 - w * 7); // Monday
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const weekSessions = sessions.filter((s) => {
      const d = new Date(s.started_at);
      return d >= weekStart && d < weekEnd;
    });

    const label = w === 0 ? 'Diese' : w === 1 ? 'Letzte' : `${w}w`;
    weeks.push({
      label,
      workouts: weekSessions.length,
      minutes: weekSessions.reduce((a, s) => a + Math.round(s.duration_sec / 60), 0),
    });
  }

  const maxMinutes = Math.max(...weeks.map((w) => w.minutes), 1);

  // Totals
  const totalWorkouts = sessions.length;
  const totalMinutes = sessions.reduce((a, s) => a + Math.round(s.duration_sec / 60), 0);
  const avgDuration = totalWorkouts > 0 ? Math.round(totalMinutes / totalWorkouts) : 0;

  // Average per week (based on span from first to last session)
  let avgPerWeek = 0;
  if (sessions.length >= 2) {
    const sorted = [...sessions].sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime());
    const firstDate = new Date(sorted[0].started_at);
    const lastDate = new Date(sorted[sorted.length - 1].started_at);
    const spanWeeks = Math.max(1, (lastDate.getTime() - firstDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    avgPerWeek = totalWorkouts / spanWeeks;
  } else if (sessions.length === 1) {
    avgPerWeek = 1;
  }

  // Personal records
  const records: { label: string; value: string }[] = [];

  if (sessions.length > 0) {
    // Longest session
    const longest = sessions.reduce((a, b) => a.duration_sec > b.duration_sec ? a : b);
    records.push({
      label: 'Längstes Workout',
      value: `${Math.round(longest.duration_sec / 60)} Min`,
    });

    // Most stations
    const mostStations = sessions.reduce((a, b) => a.station_count > b.station_count ? a : b);
    records.push({
      label: 'Meiste Stationen',
      value: `${mostStations.station_count} Stationen`,
    });

    // Most rounds
    const mostRounds = sessions.reduce((a, b) => a.rounds > b.rounds ? a : b);
    if (mostRounds.rounds > 1) {
      records.push({
        label: 'Meiste Runden',
        value: `${mostRounds.rounds} Runden`,
      });
    }
  }

  return { weeks, maxMinutes, totalWorkouts, totalMinutes, avgDuration, avgPerWeek, records };
}
