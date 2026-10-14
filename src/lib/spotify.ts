const STORAGE_KEY = 'ryng_spotify_token';
const CLIENT_ID_KEY = 'ryng_spotify_client_id';
const PKCE_KEY = 'ryng_spotify_pkce';
const SCOPES = 'user-modify-playback-state user-read-playback-state user-read-currently-playing';
const TOKEN_URL = 'https://accounts.spotify.com/api/token';

/** Spotify tokens last 3600s; expire 300s early to avoid mid-request failures. */
const TOKEN_LIFETIME_S = 3600;
const TOKEN_BUFFER_S = 300;

interface StoredToken {
  token: string;
  expiresAt: number; // epoch ms
  refreshToken?: string;
}

export function getSpotifyClientId(): string {
  return localStorage.getItem(CLIENT_ID_KEY) ?? '';
}

export function setSpotifyClientId(id: string) {
  localStorage.setItem(CLIENT_ID_KEY, id);
}

function readStored(): StoredToken | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed: StoredToken = JSON.parse(raw);
    return parsed.token && parsed.expiresAt ? parsed : null;
  } catch {
    // Old format (plain string) — treat as expired
    return null;
  }
}

/** Current access token if still valid (no network). */
export function getSpotifyToken(): string | null {
  const stored = readStored();
  return stored && Date.now() < stored.expiresAt ? stored.token : null;
}

function storeToken(token: string, expiresInS = TOKEN_LIFETIME_S, refreshToken?: string) {
  const stored: StoredToken = {
    token,
    expiresAt: Date.now() + (expiresInS - TOKEN_BUFFER_S) * 1000,
    refreshToken: refreshToken ?? readStored()?.refreshToken,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
}

export function isSpotifyConnected(): boolean {
  const stored = readStored();
  return !!stored && (Date.now() < stored.expiresAt || !!stored.refreshToken);
}

export function disconnectSpotify() {
  localStorage.removeItem(STORAGE_KEY);
}

// --- PKCE helpers ---

function randomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

async function codeChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function redirectUri() {
  return window.location.origin + '/';
}

/**
 * Start Spotify's Authorization Code flow with PKCE (the implicit grant is
 * deprecated). Redirects to Spotify; handleSpotifyCallback() finishes it.
 */
export async function startSpotifyAuth() {
  const clientId = getSpotifyClientId();
  if (!clientId) throw new Error('Spotify Client ID nicht gesetzt');

  const verifier = randomString(64);
  const state = randomString(24);
  sessionStorage.setItem(PKCE_KEY, JSON.stringify({ verifier, state }));

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri(),
    scope: SCOPES,
    state,
    code_challenge_method: 'S256',
    code_challenge: await codeChallenge(verifier),
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params}`;
}

/**
 * Finish the PKCE flow if the URL carries our Spotify callback. Only acts
 * when the `state` matches the one we generated, so foreign or forged
 * redirects are ignored. Call on app start.
 */
export async function handleSpotifyCallback(): Promise<boolean> {
  const url = new URL(window.location.href);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const pendingRaw = sessionStorage.getItem(PKCE_KEY);
  if (!code || !state || !pendingRaw) return false;

  const pending = JSON.parse(pendingRaw) as { verifier: string; state: string };
  if (pending.state !== state) return false;
  sessionStorage.removeItem(PKCE_KEY);

  // Clean the URL right away so the code can't be reused or leak.
  url.searchParams.delete('code');
  url.searchParams.delete('state');
  window.history.replaceState(null, '', url.pathname + url.search + url.hash);

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri(),
      client_id: getSpotifyClientId(),
      code_verifier: pending.verifier,
    }),
  });
  if (!res.ok) return false;
  const data = await res.json();
  storeToken(data.access_token, data.expires_in, data.refresh_token);
  return true;
}

/** Valid access token, refreshing it if needed. */
async function getValidSpotifyToken(): Promise<string | null> {
  const valid = getSpotifyToken();
  if (valid) return valid;

  const stored = readStored();
  const clientId = getSpotifyClientId();
  if (!stored?.refreshToken || !clientId) return null;

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: stored.refreshToken,
      client_id: clientId,
    }),
  });
  if (!res.ok) {
    disconnectSpotify();
    return null;
  }
  const data = await res.json();
  storeToken(data.access_token, data.expires_in, data.refresh_token);
  return data.access_token;
}

// --- Playback Controls ---

async function spotifyFetch(endpoint: string, method = 'PUT', body?: unknown) {
  const token = await getValidSpotifyToken();
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
