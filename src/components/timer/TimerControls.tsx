import { Icon } from '../ui/Icon.tsx';
import '../../styles/timer-controls.css';

interface TimerControlsProps {
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onSkipBack: () => void;
  onSkipForward: () => void;
  onStop: () => void;
}

export function TimerControls({ isPaused, onPause, onResume, onSkipBack, onSkipForward, onStop }: TimerControlsProps) {
  return (
    <div className="timer-controls">
      <div className="tc-row">
        <button className="tc-btn tc-btn--nav" onClick={onSkipBack} aria-label="Zurück">
          <Icon name="skip-back" size={20} />
          <span>ZURÜCK</span>
        </button>
        <button className="tc-btn tc-btn--nav" onClick={onSkipForward} aria-label="Weiter">
          <span>WEITER</span>
          <Icon name="skip-forward" size={20} />
        </button>
      </div>
      <div className="tc-row">
        <button
          className="tc-btn tc-btn--primary"
          onClick={isPaused ? onResume : onPause}
          aria-label={isPaused ? 'Fortsetzen' : 'Pause'}
        >
          <Icon name={isPaused ? 'play' : 'pause'} size={22} />
          <span>{isPaused ? 'WEITER' : 'PAUSE'}</span>
        </button>
        <button className="tc-btn tc-btn--danger" onClick={onStop} aria-label="Stopp">
          <Icon name="stop-square" size={18} />
        </button>
      </div>
    </div>
  );
}
