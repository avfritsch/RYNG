import { BADGES, type Badge, type BadgeStats } from '../../lib/badges.ts';
import '../../styles/badge-grid.css';

interface BadgeGridProps {
  earned: Badge[];
  nextBadge: Badge | null;
  stats: BadgeStats;
}

function getProgress(badge: Badge, stats: BadgeStats): number | null {
  // Provide progress only for the "next" badge
  if (badge.id.includes('workout')) {
    const thresholds: Record<string, number> = {
      'first-workout': 1,
      'ten-workouts': 10,
      'twentyfive-workouts': 25,
      'fifty-workouts': 50,
      'hundred-workouts': 100,
      'twofifty-workouts': 250,
    };
    const target = thresholds[badge.id];
    if (target) return Math.min(stats.totalWorkouts / target, 1);
  }
  if (badge.id === 'streak-7') return Math.min(stats.maxStreak / 7, 1);
  if (badge.id === 'streak-30') return Math.min(stats.maxStreak / 30, 1);
  if (badge.id === 'first-gym') return Math.min(stats.gymWorkouts / 1, 1);
  if (badge.id === 'ten-hours') return Math.min(stats.totalMinutes / 600, 1);
  return null;
}

export function BadgeGrid({ earned, nextBadge, stats }: BadgeGridProps) {
  const earnedIds = new Set(earned.map((b) => b.id));

  return (
    <div className="badge-grid">
      {BADGES.map((badge) => {
        const isEarned = earnedIds.has(badge.id);
        const isNext = nextBadge?.id === badge.id;
        const progress = isNext ? getProgress(badge, stats) : null;

        let cellClass = 'badge-cell';
        if (isEarned) cellClass += ' badge-cell--earned';
        else if (isNext) cellClass += ' badge-cell--next';
        else cellClass += ' badge-cell--locked';

        return (
          <div key={badge.id} className={cellClass} title={badge.description}>
            <span className={`badge-icon${!isEarned ? ' badge-icon--locked' : ''}`}>
              {isEarned || isNext ? badge.icon : '\u{1F512}'}
            </span>
            <span className="badge-name">{badge.name}</span>
            {isNext && progress !== null && (
              <div className="badge-progress">
                <div
                  className="badge-progress-fill"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
