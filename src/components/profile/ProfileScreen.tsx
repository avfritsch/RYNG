import { useState, useRef, useEffect } from 'react';
import { signOut, deleteAccount } from '../../lib/auth.ts';
import { exportBackup, downloadBackup, importBackup } from '../../lib/backup.ts';
import { isSpeechAvailable, isSpeechEnabled, setSpeechEnabled } from '../../lib/speech.ts';
import { useHeartRate } from '../../hooks/useHeartRate.ts';
import {
  getSpotifyClientId, setSpotifyClientId,
  isSpotifyConnected, startSpotifyAuth, disconnectSpotify,
} from '../../lib/spotify.ts';
import { getTheme, setTheme, type Theme } from '../../lib/theme.ts';
import { getWeeklyGoal, setWeeklyGoal } from '../../lib/weekly-goal.ts';
import { toast } from '../../stores/toast-store.ts';
import { useInstallStore } from '../../stores/install-store.ts';
import { useAuth } from '../../hooks/useAuth.ts';
import { MesocycleWidget } from './MesocycleWidget.tsx';
import { MesocycleEditor } from './MesocycleEditor.tsx';
import { BadgeGrid } from '../ui/BadgeGrid.tsx';
import { ConfirmModal } from '../ui/ConfirmModal.tsx';
import { useBadges } from '../../hooks/useBadges.ts';
import { FeatureHint } from '../ui/FeatureHint.tsx';
import { useNotificationPrefs, useUpdateNotificationPrefs } from '../../hooks/useNotificationPrefs.ts';
import { subscribeToPush, isPushSubscribed } from '../../lib/push.ts';
import '../../styles/profile-screen.css';
import '../../styles/weekly-goal.css';

export function ProfileScreen() {
  const { user } = useAuth();
  const canInstall = useInstallStore((s) => s.canInstall);
  const installApp = useInstallStore((s) => s.install);
  const [showEditor, setShowEditor] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<Theme>(getTheme());
  const [speechOn, setSpeechOn] = useState(isSpeechEnabled());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const hr = useHeartRate();
  const badges = useBadges();
  const [spotifyId, setSpotifyId] = useState(getSpotifyClientId());
  const [spotifyConnected, setSpotifyConnected] = useState(isSpotifyConnected());
  const [weeklyGoal, setWeeklyGoalState] = useState<number | null>(getWeeklyGoal());
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const notifPrefs = useNotificationPrefs();
  const updateNotifPrefs = useUpdateNotificationPrefs();
  const [pushSubscribed, setPushSubscribed] = useState(false);

  useEffect(() => {
    isPushSubscribed().then(setPushSubscribed);
  }, []);

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

      <FeatureHint hintId="mesocycle">
        Richte einen Mesozyklus ein für automatische Progression über mehrere Wochen.
      </FeatureHint>

      {showEditor ? (
        <MesocycleEditor onClose={() => setShowEditor(false)} />
      ) : (
        <MesocycleWidget onEdit={() => setShowEditor(true)} />
      )}

      <div className="profile-section">
        <h3 className="profile-section-title">Erfolge</h3>
        {badges.isLoading ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>Laden...</p>
        ) : (
          <BadgeGrid earned={badges.earned} nextBadge={badges.nextBadge} stats={badges.stats} />
        )}
      </div>

      <div className="profile-section weekly-goal-section">
        <h3 className="profile-section-title">Wochenziel</h3>
        <div className="weekly-goal-stepper">
          <span className="weekly-goal-stepper__label">Trainings pro Woche</span>
          <div className="weekly-goal-stepper__controls">
            <button
              className="weekly-goal-stepper__btn"
              disabled={weeklyGoal === null}
              onClick={() => {
                const next = weeklyGoal === 1 ? null : (weeklyGoal ?? 1) - 1;
                setWeeklyGoalState(next);
                setWeeklyGoal(next);
              }}
            >
              −
            </button>
            <span className="weekly-goal-stepper__value">
              {weeklyGoal === null ? 'Aus' : weeklyGoal}
            </span>
            <button
              className="weekly-goal-stepper__btn"
              disabled={weeklyGoal === 7}
              onClick={() => {
                const next = weeklyGoal === null ? 1 : Math.min(weeklyGoal + 1, 7);
                setWeeklyGoalState(next);
                setWeeklyGoal(next);
              }}
            >
              +
            </button>
          </div>
        </div>
        {weeklyGoal === null && (
          <p className="weekly-goal-hint">Setze ein Wochenziel für mehr Motivation</p>
        )}
      </div>

      <div className="profile-section">
        <h3 className="profile-section-title">Benachrichtigungen</h3>
        <label className="profile-toggle">
          <span>Trainings-Erinnerung</span>
          <input
            type="checkbox"
            checked={notifPrefs.data?.reminder_enabled ?? false}
            onChange={async (e) => {
              const enabled = e.target.checked;
              if (enabled && !pushSubscribed) {
                const ok = await subscribeToPush();
                if (!ok) {
                  toast.error('Push-Benachrichtigungen konnten nicht aktiviert werden');
                  return;
                }
                setPushSubscribed(true);
              }
              updateNotifPrefs.mutate({ reminder_enabled: enabled });
            }}
          />
        </label>
        {notifPrefs.data?.reminder_enabled && (
          <label className="profile-toggle" style={{ marginTop: 8 }}>
            <span>Uhrzeit</span>
            <select
              value={notifPrefs.data?.reminder_time?.slice(0, 5) ?? '18:00'}
              onChange={(e) => updateNotifPrefs.mutate({ reminder_time: e.target.value })}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                padding: '6px 10px',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-primary)',
              }}
            >
              {Array.from({ length: 17 }, (_, i) => {
                const h = String(i + 6).padStart(2, '0');
                return <option key={h} value={`${h}:00`}>{`${h}:00`}</option>;
              })}
            </select>
          </label>
        )}
        <label className="profile-toggle">
          <span>Wochen-Zusammenfassung</span>
          <input
            type="checkbox"
            checked={notifPrefs.data?.recap_enabled ?? true}
            onChange={async (e) => {
              const enabled = e.target.checked;
              if (enabled && !pushSubscribed) {
                const ok = await subscribeToPush();
                if (!ok) {
                  toast.error('Push-Benachrichtigungen konnten nicht aktiviert werden');
                  return;
                }
                setPushSubscribed(true);
              }
              updateNotifPrefs.mutate({ recap_enabled: enabled });
            }}
          />
        </label>
        <label className="profile-toggle">
          <span>Comeback-Erinnerung</span>
          <input
            type="checkbox"
            checked={notifPrefs.data?.comeback_enabled ?? true}
            onChange={async (e) => {
              const enabled = e.target.checked;
              if (enabled && !pushSubscribed) {
                const ok = await subscribeToPush();
                if (!ok) {
                  toast.error('Push-Benachrichtigungen konnten nicht aktiviert werden');
                  return;
                }
                setPushSubscribed(true);
              }
              updateNotifPrefs.mutate({ comeback_enabled: enabled });
            }}
          />
        </label>
      </div>

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

      <FeatureHint hintId="heartrate">
        Verbinde einen Bluetooth-Brustgurt für Live-Herzfrequenz im Timer.
      </FeatureHint>

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

      <FeatureHint hintId="spotify">
        Verbinde Spotify — die Musik pausiert automatisch in Trainingspausen.
      </FeatureHint>

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

      {canInstall && (
        <div className="profile-section">
          <h3 className="profile-section-title">App</h3>
          <button
            className="profile-backup-btn"
            style={{ width: '100%' }}
            onClick={installApp}
          >
            App installieren
          </button>
        </div>
      )}

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
