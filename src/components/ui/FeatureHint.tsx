import { useState, type ReactNode } from 'react';
import { isHintSeen, markHintSeen, type HintId } from '../../lib/feature-hints.ts';
import '../../styles/feature-hint.css';

interface FeatureHintProps {
  hintId: HintId;
  children: ReactNode;
}

export function FeatureHint({ hintId, children }: FeatureHintProps) {
  const [visible, setVisible] = useState(() => !isHintSeen(hintId));

  if (!visible) return null;

  function dismiss() {
    markHintSeen(hintId);
    setVisible(false);
  }

  return (
    <div className="feature-hint">
      <span className="feature-hint-icon" aria-hidden="true">💡</span>
      <span className="feature-hint-text">{children}</span>
      <button className="feature-hint-close" onClick={dismiss} aria-label="Hinweis schließen">
        ×
      </button>
    </div>
  );
}
