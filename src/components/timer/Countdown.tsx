import '../../styles/countdown.css';

interface CountdownProps {
  seconds: number;
  phase: string;
}

export function Countdown({ seconds, phase }: CountdownProps) {
  const phaseColor: Record<string, string> = {
    work: 'var(--color-work)',
    warmup: 'var(--color-prepare)',
    pause: 'var(--color-rest)',
    roundPause: 'var(--color-info)',
  };

  const color = phaseColor[phase] ?? 'var(--text-primary)';
  const blink = seconds <= 3;

  return (
    <div
      className={`countdown ${blink ? 'countdown--blink' : ''}`}
      style={{ color }}
    >
      {seconds}
    </div>
  );
}
