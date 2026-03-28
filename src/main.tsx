import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { handleSpotifyCallback } from './lib/spotify.ts';
import { getTheme, applyTheme } from './lib/theme.ts';
import App from './App.tsx';
import './styles/globals.css';
import './styles/transitions.css';

// Handle Spotify OAuth callback
handleSpotifyCallback();

// Apply saved theme
applyTheme(getTheme());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
