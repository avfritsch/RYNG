import type { Session } from '../../types/session.ts';
import '../../styles/week-heatmap.css';

interface WeekHeatmapProps {
  sessions: Session[];
}

const dayLabels = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

export function WeekHeatmap({ sessions }: WeekHeatmapProps) {
  // Get training counts for this week (Mon-Sun)
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon...
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  // Count sessions per weekday
  const counts = Array(7).fill(0);
  for (const s of sessions) {
    const d = new Date(s.started_at);
    if (d >= monday) {
      const idx = (d.getDay() + 6) % 7; // Mon=0, Tue=1, ..., Sun=6
      counts[idx]++;
    }
  }

  const todayIdx = (today.getDay() + 6) % 7;

  return (
    <div className="week-heatmap">
      {dayLabels.map((label, i) => {
        const count = counts[i];
        const isToday = i === todayIdx;
        let cls = 'heatmap-cell';
        if (count > 0) cls += ' heatmap-cell--active';
        if (isToday) cls += ' heatmap-cell--today';

        return (
          <div key={i} className={cls}>
            <span className="heatmap-label">{label}</span>
            {count > 0 && <span className="heatmap-count">{count}</span>}
          </div>
        );
      })}
    </div>
  );
}
