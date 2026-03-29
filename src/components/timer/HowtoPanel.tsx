import { ExerciseAnimation } from '../ui/ExerciseAnimation.tsx';
import { getAnimationFrames } from '../../lib/exercise-animations.ts';
import '../../styles/howto-panel.css';

interface HowtoPanelProps {
  text: string;
  exerciseName?: string;
}

export function HowtoPanel({ text, exerciseName }: HowtoPanelProps) {
  const frames = exerciseName ? getAnimationFrames(exerciseName) : null;

  if (!text && !frames) return null;

  return (
    <div className="howto-panel">
      {frames && <ExerciseAnimation frames={frames} />}
      {text && <div className="howto-text">{text}</div>}
    </div>
  );
}
