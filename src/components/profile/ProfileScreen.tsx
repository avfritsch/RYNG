import { useState, useRef } from 'react';
import { signOut, deleteAccount } from '../../lib/auth.ts';
import { exportBackup, downloadBackup, importBackup } from '../../lib/backup.ts';
import { isSpeechAvailable, isSpeechEnabled, setSpeechEnabled } from '../../lib/speech.ts';
import { useHeartRate } from '../../hooks/useHeartRate.ts';
import {
  getSpotifyClientId, setSpotifyClientId,
  isSpotifyConnected, startSpotifyAuth, disconnectSpotify,
} from '../../lib/spotify.ts';
import { getTheme, setTheme, type Theme } from '../../lib/theme.ts';
import { toast } from '../../stores/toast-store.ts';
import { useAuth } from '../../hooks/useAuth.ts';
import { MesocycleWidget } from './MesocycleWidget.tsx';
import { MesocycleEditor } from './MesocycleEditor.tsx';
import { ConfirmModal } from '../ui/ConfirmModal.tsx';
import '../../styles/profile-screen.css';

export function ProfileScreen() {
  const { user } = useAuth();
  const [showEditor, setShowEditor] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<Theme>(getTheme());
  const [speechOn, setSpeechOn] = useState(isSpeechEnabled());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const hr = useHeartRate();
  const [spotifyId, setSpotifyId] = useState(getSpotifyClientId());
  const [spotifyConnected, setSpotifyConnected] = useState(isSpotifyConnected());
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleExport() {
    setExporting(true);
    setMessage('');
    try {
      const data = await exportBackup();
      downloadBackup(data);
      toast.success('Backup heruntergeladen');
    } catch (err) {
      setMessage(`Export-Fehler: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setExporting(false);
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setMessage('');
    try {
      const result = await importBackup(file);
      toast.success(`Import erfolgreich: ${result.imported} Pläne importiert`);
    } catch (err) {
      setMessage(`Import-Fehler: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div className="profile-screen">
      <h2 className="profile-title">Profil</h2>
      <p className="profile-email">{user?.email}</p>

      {showEditor ? (
        <MesocycleEditor onClose={() => setShowEditor(false)} />
      ) : (
        <MesocycleWidget onEdit={() => setShowEditor(true)} />
      )}

      <div className="profile-section">
        <h3 className="profile-section-title">Darstellung</h3>
        <label className="profile-toggle">
          <span>Light Mode</span>
          <input
            type="checkbox"
            checked={currentTheme === 'light'}
            onChange={(e) => {
              const t = e.target.checked ? 'light' : 'dark';
              setCurrentTheme(t);
              setTheme(t);
              toast.info(t === 'light' ? 'Light Mode aktiviert' : 'Dark Mode aktiviert');
            }}
          />
        </label>
      </div>

      {isSpeechAvailable() && (
        <div className="profile-section">
          <h3 className="profile-section-title">Timer</h3>
          <label className="profile-toggle">
            <span>Sprachansagen</span>
            <input
              type="checkbox"
              checked={speechOn}
              onChange={(e) => {
                setSpeechOn(e.target.checked);
                setSpeechEnabled(e.target.checked);
                toast.info(e.target.checked ? 'Sprachansagen aktiviert' : 'Sprachansagen deaktiviert');
              }}
            />
          </label>
        </div>
      )}

      {hr.available && (
        <div className="profile-section">
          <h3 className="profile-section-title">Herzfrequenz</h3>
          <div className="hr-widget">
            <div className="hr-widget-info">
              <span className="hr-widget-label">Bluetooth HR-Sensor</span>
              <span className={`hr-widget-status ${hr.connected ? 'hr-widget-status--connected' : ''}`}>
                {hr.connected ? `${hr.deviceName} · ${hr.bpm} BPM` : 'Nicht verbunden'}
              </span>
            </div>
            <button
              className={`hr-connect-btn ${hr.connected ? 'hr-connect-btn--disconnect' : 'hr-connect-btn--connect'}`}
              onClick={hr.connected ? hr.disconnect : hr.connect}
            >
              {hr.connected ? 'Trennen' : 'Verbinden'}
            </button>
          </div>
        </div>
      )}

      <div className="profile-section">
        <h3 className="profile-section-title">Spotify</h3>
        {spotifyConnected ? (
          <div className="hr-widget">
            <div className="hr-widget-info">
              <span className="hr-widget-label">Spotify verbunden</span>
              <span className="hr-widget-status hr-widget-status--connected">Musik steuert sich im Timer automatisch</span>
            </div>
            <button
              className="hr-connect-btn hr-connect-btn--disconnect"
              onClick={() => { disconnectSpotify(); setSpotifyConnected(false); toast.info('Spotify getrennt'); }}
            >
              Trennen
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              className="share-code"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '10px 12px', fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}
              placeholder="Spotify Client ID"
              value={spotifyId}
              onChange={(e) => { setSpotifyId(e.target.value); setSpotifyClientId(e.target.value); }}
            />
            <button
              className="hr-connect-btn hr-connect-btn--connect"
              style={{ width: '100%', padding: 12 }}
              onClick={() => {
                try { startSpotifyAuth(); } catch (err) { toast.error(err instanceof Error ? err.message : 'Fehler'); }
              }}
              disabled={!spotifyId.trim()}
            >
              Mit Spotify verbinden
            </button>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              Erstelle eine App auf developer.spotify.com und trage die Client ID ein. Redirect URI: {window.location.origin}/
            </p>
          </div>
        )}
      </div>

      <div className="profile-section">
        <h3 className="profile-section-title">Daten</h3>
        <div className="profile-backup-btns">
          <button
            className="profile-backup-btn"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? 'Exportiere...' : 'JSON Export'}
          </button>
          <button
            className="profile-backup-btn"
            onClick={() => fileRef.current?.click()}
            disabled={importing}
          >
            {importing ? 'Importiere...' : 'JSON Import'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleImport}
          />
        </div>
        {message && (
          <p className="profile-message">{message}</p>
        )}
      </div>

      <button
        className="profile-signout"
        style={{ background: 'var(--color-rest)', color: 'var(--text-primary)', marginBottom: 8 }}
        onClick={() => { throw new Error('Sentry Test Error — this is intentional!'); }}
      >
        Sentry Test Error
      </button>

      <button className="profile-signout" onClick={() => signOut()}>
        Abmelden
      </button>

      <button
        className="profile-delete-account"
        onClick={() => setShowDeleteConfirm(true)}
      >
        Konto löschen
      </button>

      {showDeleteConfirm && (
        <ConfirmModal
          title="Konto löschen"
          message="Dein Konto und alle Daten (Pläne, Sessions, Übungen) werden unwiderruflich gelöscht."
          confirmLabel="Endgültig löschen"
          danger
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={async () => {
            try {
              await deleteAccount();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : 'Fehler beim Löschen');
              setShowDeleteConfirm(false);
            }
          }}
        />
      )}
    </div>
  );
}
