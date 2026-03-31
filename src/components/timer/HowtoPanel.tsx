import { ExerciseIllustration } from '../ui/ExerciseIllustration.tsx';
import '../../styles/howto-panel.css';

interface HowtoPanelProps {
  text: string;
  illustrationKey?: string;
}

export function HowtoPanel({ text, illustrationKey }: HowtoPanelProps) {
  if (!text && !illustrationKey) return null;

  return (
    <div className="howto-panel">
      <ExerciseIllustration illustrationKey={illustrationKey} size="preview" />
      {text}
    </div>
  );
}
