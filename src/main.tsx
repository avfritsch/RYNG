import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { handleSpotifyCallback } from './lib/spotify.ts';
import { getTheme, applyTheme } from './lib/theme.ts';
import App from './App.tsx';
import './styles/globals.css';
import './styles/transitions.css';

// Error monitoring — lazy-loaded to keep Sentry (~77KB) out of the critical path
const sentryDsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
if (sentryDsn) {
  import('@sentry/react').then((Sentry) => {
    Sentry.init({
      dsn: sentryDsn,
      environment: import.meta.env.MODE,
      tracesSampleRate: 0.2,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 1.0,
    });
  });
}

// Handle Spotify OAuth callback
handleSpotifyCallback();

// Apply saved theme
applyTheme(getTheme());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
