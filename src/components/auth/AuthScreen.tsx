import { useState } from 'react';
import { signIn, signUp } from '../../lib/auth.ts';
import '../../styles/auth.css';

export function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password);
        setSuccess('Konto erstellt! Du kannst dich jetzt einloggen.');
        setIsSignUp(false);
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
          <label htmlFor="auth-password" className="sr-only">Passwort</label>
          <input
            id="auth-password"
            type="password"
            placeholder="Passwort"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            className="auth-input"
          />
          {error && <p className="auth-error" role="alert">{error}</p>}
          {success && <p className="auth-success-msg">{success}</p>}
          <button
            type="submit"
            disabled={loading || !email || !password}
            className="auth-button"
          >
            {loading ? 'Laden...' : isSignUp ? 'Registrieren' : 'Anmelden'}
          </button>
        </form>

        <button
          className="auth-link"
          onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccess(''); }}
        >
          {isSignUp ? 'Schon ein Konto? Anmelden' : 'Noch kein Konto? Registrieren'}
        </button>
      </div>
    </div>
  );
}
