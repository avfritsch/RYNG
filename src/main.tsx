import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { handleSpotifyCallback } from './lib/spotify.ts';
import { getTheme, applyTheme } from './lib/theme.ts';
import { useInstallStore, type BeforeInstallPromptEvent } from './stores/install-store.ts';
import { env } from './lib/env.ts';
import App from './App.tsx';
import './styles/globals.css';
import './styles/transitions.css';

// Track visit count for install prompt
const visits = Number(localStorage.getItem('ryng_visits') || '0') + 1;
localStorage.setItem('ryng_visits', String(visits));

// Capture PWA install prompt
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  useInstallStore.getState().setPrompt(e as BeforeInstallPromptEvent);
});

// Error monitoring — lazy-loaded to keep Sentry (~77KB) out of the critical path
const sentryDsn = env.VITE_SENTRY_DSN;
if (sentryDsn) {
  import('@sentry/react').then((Sentry) => {
    Sentry.init({
      dsn: sentryDsn,
      environment: import.meta.env.MODE,
      release: env.VITE_APP_VERSION || 'dev',
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

import { initWebVitals } from './lib/web-vitals.ts';
initWebVitals();
