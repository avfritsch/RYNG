import '../../styles/phase-label.css';

interface PhaseLabelProps {
  stationName: string;
  phase: string;
  isWarmup: boolean;
}

export function PhaseLabel({ stationName, phase, isWarmup }: PhaseLabelProps) {
  const phaseLabels: Record<string, string> = {
    work: 'Kraftzirkel',
    warmup: 'Aufwärmen',
    pause: 'Pause',
    roundPause: 'Rundenpause',
  };

  const badgeClass = isWarmup || phase === 'warmup' ? 'phase-badge--warmup' : 'phase-badge--kraft';

  return (
    <div className="phase-label">
      <span className={`phase-badge ${badgeClass}`}>
        {phaseLabels[phase] ?? phase}
      </span>
      <h2 className="phase-station-name">{stationName}</h2>
    </div>
  );
}
