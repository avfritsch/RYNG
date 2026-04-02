import { getWeeklyGoal } from '../../lib/weekly-goal.ts';
import '../../styles/weekly-goal.css';

interface WeeklyGoalRingProps {
  weekCount: number;
}

export function WeeklyGoalRing({ weekCount }: WeeklyGoalRingProps) {
  const goal = getWeeklyGoal();
  if (goal === null) return null;

  const done = weekCount >= goal;
  const ratio = Math.min(weekCount / goal, 1);

  const size = 60;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - ratio);

  return (
    <div className="weekly-goal-ring">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          className="weekly-goal-ring__track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
        />
        <circle
          className={`weekly-goal-ring__progress${done ? ' weekly-goal-ring__progress--done' : ''}`}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        {done ? (
          <text
            className="weekly-goal-ring__checkmark"
            x={size / 2}
            y={size / 2}
          >
            ✓
          </text>
        ) : (
          <text
            className="weekly-goal-ring__text"
            x={size / 2}
            y={size / 2}
          >
            {weekCount}/{goal}
          </text>
        )}
      </svg>
    </div>
  );
}
