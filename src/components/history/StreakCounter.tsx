import type { Session } from '../../types/session.ts';
import { calculateStreak } from '../../lib/streak.ts';
import '../../styles/streak-counter.css';

interface StreakCounterProps {
  sessions: Session[];
}

export function StreakCounter({ sessions }: StreakCounterProps) {
  const streak = calculateStreak(sessions);

  return (
    <div className="streak-counter">
      <span className={`streak-value ${streak > 0 ? 'streak-value--active' : 'streak-value--zero'}`}>
        {streak}
      </span>
      <span className="streak-label">
        {streak === 1 ? 'Tag in Folge' : 'Tage in Folge'}
      </span>
    </div>
  );
}
