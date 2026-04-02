import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getSpotifyToken,
  getSpotifyClientId,
  setSpotifyClientId,
  isSpotifyConnected,
  disconnectSpotify,
  handleSpotifyCallback,
  startSpotifyAuth,
} from './spotify.ts';

const STORAGE_KEY = 'ryng_spotify_token';
const CLIENT_ID_KEY = 'ryng_spotify_client_id';

/** TOKEN_LIFETIME_S - TOKEN_BUFFER_S = 3300s effective TTL */
const EFFECTIVE_TTL_MS = (3600 - 300) * 1000;

beforeEach(() => {
  localStorage.clear();
  vi.useRealTimers();
});

describe('spotify: token TTL logic', () => {
  it('getSpotifyToken returns null when nothing stored', () => {
    expect(getSpotifyToken()).toBeNull();
  });

  it('returns token after handleSpotifyCallback stores it', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));

    // Simulate Spotify redirect with access_token in hash
    Object.defineProperty(window, 'location', {
      value: {
        ...window.location,
        hash: '#access_token=abc123&token_type=Bearer&expires_in=3600',
        pathname: '/',
        origin: 'http://localhost:3000',
      },
      writable: true,
      configurable: true,
    });
    window.history.replaceState = vi.fn();

    const result = handleSpotifyCallback();
    expect(result).toBe(true);
    expect(getSpotifyToken()).toBe('abc123');
  });

  it('token expires after the effective TTL', () => {
    vi.useFakeTimers();
    const start = new Date('2026-01-15T12:00:00Z');
    vi.setSystemTime(start);

    // Store a token by writing to localStorage directly (same format as setSpotifyToken)
    const stored = {
      token: 'test-token',
      expiresAt: Date.now() + EFFECTIVE_TTL_MS,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

    // Token is valid right now
    expect(getSpotifyToken()).toBe('test-token');

    // Advance time just before expiry
    vi.setSystemTime(new Date(start.getTime() + EFFECTIVE_TTL_MS - 1000));
    expect(getSpotifyToken()).toBe('test-token');

    // Advance time past expiry
    vi.setSystemTime(new Date(start.getTime() + EFFECTIVE_TTL_MS + 1));
    expect(getSpotifyToken()).toBeNull();
  });

  it('token exactly at expiry returns null', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));

    const expiresAt = Date.now() + EFFECTIVE_TTL_MS;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: 'tok', expiresAt }));

    // Advance to exact expiry time — Date.now() is NOT < expiresAt
    vi.setSystemTime(new Date(expiresAt));
    expect(getSpotifyToken()).toBeNull();
  });

  it('old format (plain string in localStorage) is treated as expired', () => {
    localStorage.setItem(STORAGE_KEY, 'plain-old-token');
    expect(getSpotifyToken()).toBeNull();
  });

  it('malformed JSON in localStorage is treated as expired', () => {
    localStorage.setItem(STORAGE_KEY, '{bad json!!');
    expect(getSpotifyToken()).toBeNull();
  });

  it('JSON without expiresAt is treated as expired', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: 'abc' }));
    expect(getSpotifyToken()).toBeNull();
  });

  it('disconnectSpotify removes the token', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));

    const stored = {
      token: 'to-remove',
      expiresAt: Date.now() + EFFECTIVE_TTL_MS,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    expect(getSpotifyToken()).toBe('to-remove');

    disconnectSpotify();
    expect(getSpotifyToken()).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('isSpotifyConnected reflects token presence', () => {
    expect(isSpotifyConnected()).toBe(false);

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
    const stored = {
      token: 'connected-token',
      expiresAt: Date.now() + EFFECTIVE_TTL_MS,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    expect(isSpotifyConnected()).toBe(true);

    disconnectSpotify();
    expect(isSpotifyConnected()).toBe(false);
  });
});

describe('spotify: client ID', () => {
  it('getSpotifyClientId returns empty string when not set', () => {
    expect(getSpotifyClientId()).toBe('');
  });

  it('setSpotifyClientId / getSpotifyClientId round-trips', () => {
    setSpotifyClientId('my-client-id');
    expect(getSpotifyClientId()).toBe('my-client-id');
    expect(localStorage.getItem(CLIENT_ID_KEY)).toBe('my-client-id');
  });
});

describe('spotify: startSpotifyAuth', () => {
  it('throws when client ID is not set', () => {
    expect(() => startSpotifyAuth()).toThrow('Spotify Client ID nicht gesetzt');
  });
});

describe('spotify: handleSpotifyCallback', () => {
  it('returns false when hash has no access_token', () => {
    Object.defineProperty(window, 'location', {
      value: {
        ...window.location,
        hash: '',
        pathname: '/',
        origin: 'http://localhost:3000',
      },
      writable: true,
      configurable: true,
    });
    expect(handleSpotifyCallback()).toBe(false);
  });
});
