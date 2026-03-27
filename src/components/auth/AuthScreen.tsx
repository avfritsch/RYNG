import { useState } from 'react';
import { signInWithMagicLink } from '../../lib/auth.ts';
import '../../styles/auth.css';

export function AuthScreen() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithMagicLink(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Senden');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <h1 className="auth-title">Ryng</h1>
          <div className="auth-success">
            <p>Magic Link gesendet!</p>
            <p className="auth-hint">
              Schau in dein Postfach: <strong>{email}</strong>
            </p>
          </div>
          <button
            className="auth-link"
            onClick={() => { setSent(false); setEmail(''); }}
          >
            Andere E-Mail verwenden
          </button>
        </div>
      </div>
    );
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
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button
            type="submit"
            disabled={loading || !email}
            className="auth-button"
          >
            {loading ? 'Wird gesendet...' : 'Magic Link senden'}
          </button>
        </form>
      </div>
    </div>
  );
}
