const STORAGE_KEY = 'ryng_spotify_token';
const CLIENT_ID_KEY = 'ryng_spotify_client_id';
const SCOPES = 'user-modify-playback-state user-read-playback-state user-read-currently-playing';

/** Spotify tokens last 3600s; expire 300s early to avoid mid-request failures. */
const TOKEN_LIFETIME_S = 3600;
const TOKEN_BUFFER_S = 300;

interface StoredToken {
  token: string;
  expiresAt: number; // epoch ms
}

export function getSpotifyClientId(): string {
  return localStorage.getItem(CLIENT_ID_KEY) ?? '';
}

export function setSpotifyClientId(id: string) {
  localStorage.setItem(CLIENT_ID_KEY, id);
}

export function getSpotifyToken(): string | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed: StoredToken = JSON.parse(raw);
    if (parsed.token && parsed.expiresAt) {
      return Date.now() < parsed.expiresAt ? parsed.token : null;
    }
  } catch {
    // Old format (plain string) — treat as expired
  }
  return null;
}

function setSpotifyToken(token: string) {
  const stored: StoredToken = {
    token,
    expiresAt: Date.now() + (TOKEN_LIFETIME_S - TOKEN_BUFFER_S) * 1000,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
}

export function isSpotifyConnected(): boolean {
  return !!getSpotifyToken();
}

export function disconnectSpotify() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Start Spotify OAuth Implicit Grant flow.
 * Redirects to Spotify, then back to the app with a token in the URL hash.
 */
export function startSpotifyAuth() {
  const clientId = getSpotifyClientId();
  if (!clientId) throw new Error('Spotify Client ID nicht gesetzt');

  const redirectUri = window.location.origin + '/';
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'token',
    redirect_uri: redirectUri,
    scope: SCOPES,
    show_dialog: 'false',
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params}`;
}

/**
 * Check URL hash for Spotify callback token. Call on app mount.
 */
export function handleSpotifyCallback(): boolean {
  const hash = window.location.hash;
  if (!hash.includes('access_token')) return false;

  const params = new URLSearchParams(hash.substring(1));
  const token = params.get('access_token');
  if (token) {
    setSpotifyToken(token);
    // Clean URL
    window.history.replaceState(null, '', window.location.pathname);
    return true;
  }
  return false;
}

// --- Playback Controls ---

async function spotifyFetch(endpoint: string, method = 'PUT', body?: unknown) {
  const token = getSpotifyToken();
  if (!token) return null;

  const res = await fetch(`https://api.spotify.com/v1/me/player${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    disconnectSpotify();
    return null;
  }

  if (res.status === 204 || res.status === 200) {
    return res.status === 200 ? res.json() : true;
  }

  return null;
}

export async function spotifyPlay() {
  return spotifyFetch('/play', 'PUT');
}

export async function spotifyPause() {
  return spotifyFetch('/pause', 'PUT');
}

export async function spotifyNext() {
  return spotifyFetch('/next', 'POST');
}

export async function spotifyPrevious() {
  return spotifyFetch('/previous', 'POST');
}

export async function spotifySetVolume(percent: number) {
  return spotifyFetch(`/volume?volume_percent=${Math.round(percent)}`, 'PUT');
}

export interface SpotifyPlaybackState {
  is_playing: boolean;
  item?: {
    name: string;
    artists: { name: string }[];
    album: { images: { url: string }[] };
  };
  progress_ms: number;
  duration_ms: number;
}

export async function spotifyGetState(): Promise<SpotifyPlaybackState | null> {
  return spotifyFetch('', 'GET') as Promise<SpotifyPlaybackState | null>;
}
