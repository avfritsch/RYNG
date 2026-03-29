import { useState, useEffect } from 'react';
import { encodeWorkout, decodeWorkout, generateQRCode } from '../../lib/share.ts';
import { toast } from '../../stores/toast-store.ts';
import { useFocusTrap } from '../../hooks/useFocusTrap.ts';
import { Icon } from './Icon.tsx';
import type { TimerConfig } from '../../types/timer.ts';
import '../../styles/share-modal.css';

interface ShareModalProps {
  name: string;
  config: TimerConfig;
  onClose: () => void;
}

export function ShareModal({ name, config, onClose }: ShareModalProps) {
  const trapRef = useFocusTrap<HTMLDivElement>();
  const [qrUrl, setQrUrl] = useState('');
  const encoded = encodeWorkout(name, config);

  useEffect(() => {
    generateQRCode(encoded).then(setQrUrl);
  }, [encoded]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(encoded);
      toast.success('Code kopiert');
    } catch {
      toast.error('Kopieren fehlgeschlagen');
    }
  }

  return (
    <div className="share-overlay" onClick={onClose}>
      <div ref={trapRef} className="share-modal" role="dialog" aria-modal="true" aria-label="Workout teilen" onClick={(e) => e.stopPropagation()}>
        <div className="share-header">
          <h3>Workout teilen</h3>
          <button className="share-close" onClick={onClose} aria-label="Schließen">
            <Icon name="x-close" size={18} />
          </button>
        </div>

        <p className="share-name">{name}</p>
        <p className="share-info">
          {config.stations.length} Stationen · {config.rounds} Runden
        </p>

        {qrUrl && (
          <img className="share-qr" src={qrUrl} alt="QR-Code zum Teilen" />
        )}

        <p className="share-hint">QR-Code scannen oder Code kopieren:</p>

        <div className="share-code-row">
          <input
            className="share-code"
            value={encoded}
            readOnly
            onClick={(e) => (e.target as HTMLInputElement).select()}
            aria-label="Sharing-Code"
          />
          <button className="share-copy-btn" onClick={handleCopy} aria-label="Kopieren">
            <Icon name="copy" size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Import Component ---

interface ImportModalProps {
  onImport: (name: string, config: TimerConfig) => void;
  onClose: () => void;
}

export function ImportModal({ onImport, onClose }: ImportModalProps) {
  const trapRef = useFocusTrap<HTMLDivElement>();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  function handleImport() {
    setError('');
    try {
      const { name, config } = decodeWorkout(code.trim());
      onImport(name, config);
      toast.success(`"${name}" importiert`);
      onClose();
    } catch {
      setError('Ungültiger Code. Bitte den kompletten Code einfügen.');
    }
  }

  return (
    <div className="share-overlay" onClick={onClose}>
      <div ref={trapRef} className="share-modal" role="dialog" aria-modal="true" aria-label="Workout importieren" onClick={(e) => e.stopPropagation()}>
        <div className="share-header">
          <h3>Workout importieren</h3>
          <button className="share-close" onClick={onClose} aria-label="Schließen">
            <Icon name="x-close" size={18} />
          </button>
        </div>

        <p className="share-hint">Code einfügen (von geteiltem Workout):</p>

        <textarea
          className="share-import-input"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Code hier einfügen..."
          rows={4}
          aria-label="Import-Code"
        />

        {error && <p className="share-error" role="alert">{error}</p>}

        <button
          className="share-import-btn"
          onClick={handleImport}
          disabled={!code.trim()}
        >
          Importieren
        </button>
      </div>
    </div>
  );
}
