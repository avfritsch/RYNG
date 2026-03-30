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

  // Badge color class based on phase
  let badgeClass = 'phase-badge--work';
  if (phase === 'pause') badgeClass = 'phase-badge--pause';
  else if (phase === 'roundPause') badgeClass = 'phase-badge--roundpause';
  else if (isWarmup || phase === 'warmup') badgeClass = 'phase-badge--warmup';

  // Station name: during pause, split "Pause — Name" for mixed coloring
  const isPause = phase === 'pause';

  return (
    <div className="phase-label">
      <span className={`phase-badge ${badgeClass}`}>
        {phaseLabels[phase] ?? phase}
      </span>
      {isPause ? (
        <h2 className="phase-station-name">
          <span className="phase-station-dim">Pause — </span>
          {stationName.replace(/^Pause — /, '')}
        </h2>
      ) : (
        <h2 className="phase-station-name">{stationName}</h2>
      )}
    </div>
  );
}
