import { memo, useState } from 'react';
import { Icon } from '../ui/Icon.tsx';
import { ConfirmModal } from '../ui/ConfirmModal.tsx';
import '../../styles/timer-controls.css';

interface TimerControlsProps {
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onSkipBack: () => void;
  onSkipForward: () => void;
  onStop: () => void;
}

export const TimerControls = memo(function TimerControls({ isPaused, onPause, onResume, onSkipBack, onSkipForward, onStop }: TimerControlsProps) {
  const [showStopConfirm, setShowStopConfirm] = useState(false);

  return (
    <>
      <div className="timer-controls">
        <div className="tc-row">
          <button className="tc-btn tc-btn--back" onClick={onSkipBack} aria-label="Zurück">
            <Icon name="skip-back" size={18} />
            <span>ZURÜCK</span>
          </button>
          <button className="tc-btn tc-btn--forward" onClick={onSkipForward} aria-label="Weiter">
            <span>WEITER</span>
            <Icon name="skip-forward" size={18} />
          </button>
        </div>
        <div className="tc-row">
          <button
            className="tc-btn tc-btn--primary"
            onClick={isPaused ? onResume : onPause}
            aria-label={isPaused ? 'Fortsetzen' : 'Pause'}
          >
            <Icon name={isPaused ? 'play' : 'pause'} size={20} />
            <span>{isPaused ? 'WEITER' : 'PAUSE'}</span>
          </button>
          <button className="tc-btn tc-btn--stop" onClick={() => setShowStopConfirm(true)} aria-label="Stopp">
            <Icon name="stop-square" size={18} />
            <span>STOP</span>
          </button>
        </div>
      </div>

      {showStopConfirm && (
        <ConfirmModal
          title="Workout beenden"
          message="Willst du das Training wirklich abbrechen?"
          confirmLabel="Beenden"
          danger
          onCancel={() => setShowStopConfirm(false)}
          onConfirm={() => { setShowStopConfirm(false); onStop(); }}
        />
      )}
    </>
  );
});
