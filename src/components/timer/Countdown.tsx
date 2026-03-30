import '../../styles/countdown.css';

interface CountdownProps {
  seconds: number;
  phase: string;
}

export function Countdown({ seconds, phase }: CountdownProps) {
  const phaseColor: Record<string, string> = {
    work: '#7FFF00',
    warmup: '#FFE600',
    pause: '#FF3B3B',
    roundPause: '#FFE600',
  };

  const color = phaseColor[phase] ?? '#FFFFFF';
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
