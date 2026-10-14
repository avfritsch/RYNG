import { useEffect } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap.ts';
import { Icon } from '../ui/Icon.tsx';
import type { Plan } from '../../types/plan.ts';

interface AddToPlanPickerProps {
  plans: Plan[];
  onPick: (planId: string) => void;
  onClose: () => void;
}

export function AddToPlanPicker({ plans, onPick, onClose }: AddToPlanPickerProps) {
  const trapRef = useFocusTrap<HTMLDivElement>();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="picker-overlay" onClick={onClose}>
      <div
        ref={trapRef}
        className="picker-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-to-plan-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="picker-header">
          <h3 id="add-to-plan-title">Zu Plan hinzufügen</h3>
          <button onClick={onClose} aria-label="Schließen">
            <Icon name="x-close" size={18} />
          </button>
        </div>
        <div className="picker-list">
          {plans.map((plan) => (
            <button key={plan.id} className="picker-item" onClick={() => onPick(plan.id)}>
              <span className="picker-item-name">{plan.name}</span>
              <Icon name="arrow-right" size={16} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
