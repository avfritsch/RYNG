import { Icon } from './Icon.tsx';
import { useFocusTrap } from '../../hooks/useFocusTrap.ts';
import '../../styles/confirm-modal.css';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  title,
  message,
  confirmLabel = 'Bestätigen',
  cancelLabel = 'Abbrechen',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const trapRef = useFocusTrap<HTMLDivElement>();
  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div ref={trapRef} className="confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-icon-wrap">
          <Icon name={danger ? 'alert-triangle' : 'info'} size={24} />
        </div>
        <h3 id="confirm-title" className="confirm-title">{title}</h3>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button className="confirm-btn confirm-btn--cancel" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className={`confirm-btn ${danger ? 'confirm-btn--danger' : 'confirm-btn--primary'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
