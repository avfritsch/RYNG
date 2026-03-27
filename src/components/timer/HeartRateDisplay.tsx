import { memo } from 'react';
import '../../styles/heartrate.css';

interface HeartRateDisplayProps {
  bpm: number;
}

export const HeartRateDisplay = memo(function HeartRateDisplay({ bpm }: HeartRateDisplayProps) {
  if (bpm <= 0) return null;

  const zone = bpm < 100 ? 'low' : bpm < 140 ? 'moderate' : bpm < 170 ? 'high' : 'max';

  return (
    <div className={`hr-display hr-display--${zone}`}>
      <svg className="hr-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      <span className="hr-bpm">{bpm}</span>
    </div>
  );
});
