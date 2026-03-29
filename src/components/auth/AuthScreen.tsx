import { useState } from 'react';
import { signIn, signUp, resetPassword } from '../../lib/auth.ts';
import '../../styles/auth.css';

type AuthMode = 'login' | 'signup' | 'reset';

export function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<AuthMode>('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  function switchMode(m: AuthMode) {
    setMode(m);
    setError('');
    setSuccess('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        await signUp(email, password);
        setSuccess('Bestätigungs-E-Mail gesendet! Bitte prüfe dein Postfach.');
        setMode('login');
      } else if (mode === 'reset') {
        await resetPassword(email);
        setSuccess('Link zum Zurücksetzen gesendet! Bitte prüfe dein Postfach.');
        setMode('login');
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler bei der Anmeldung');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h1 className="auth-title">Ryng</h1>
        <p className="auth-subtitle">Zirkeltraining Timer</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label htmlFor="auth-email" className="sr-only">E-Mail-Adresse</label>
          <input
            id="auth-email"
            type="email"
            placeholder="E-Mail-Adresse"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="auth-input"
          />
          {mode !== 'reset' && (
            <>
              <label htmlFor="auth-password" className="sr-only">Passwort</label>
              <input
                id="auth-password"
                type="password"
                placeholder={mode === 'signup' ? 'Passwort (min. 6 Zeichen)' : 'Passwort'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                className="auth-input"
              />
            </>
          )}
          {error && <p className="auth-error" role="alert">{error}</p>}
          {success && <p className="auth-success-msg">{success}</p>}
          <button
            type="submit"
            disabled={loading || !email || (mode !== 'reset' && !password)}
            className="auth-button"
          >
            {loading
              ? 'Laden...'
              : mode === 'signup'
                ? 'Registrieren'
                : mode === 'reset'
                  ? 'Link senden'
                  : 'Anmelden'}
          </button>
        </form>

        <div className="auth-links">
          {mode === 'login' && (
            <>
              <button className="auth-link" onClick={() => switchMode('signup')}>
                Noch kein Konto? Registrieren
              </button>
              <button className="auth-link" onClick={() => switchMode('reset')}>
                Passwort vergessen?
              </button>
            </>
          )}
          {mode === 'signup' && (
            <button className="auth-link" onClick={() => switchMode('login')}>
              Schon ein Konto? Anmelden
            </button>
          )}
          {mode === 'reset' && (
            <button className="auth-link" onClick={() => switchMode('login')}>
              Zurück zur Anmeldung
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
