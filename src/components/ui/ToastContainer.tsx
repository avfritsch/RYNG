import { useToastStore } from '../../stores/toast-store.ts';
import { Icon } from './Icon.tsx';
import '../../styles/toast.css';

const typeIcon: Record<string, string> = {
  success: 'check-circle',
  error: 'alert-triangle',
  info: 'info',
};

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.type}`}>
          <Icon name={typeIcon[t.type]} size={18} />
          <span className="toast-message">{t.message}</span>
          <button
            className="toast-dismiss"
            onClick={() => dismiss(t.id)}
            aria-label="Schließen"
          >
            <Icon name="x-close" size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
