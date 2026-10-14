import { openDB } from 'idb';
import { supabase } from './supabase.ts';
import { logger } from './logger.ts';
import type { Session, SessionEntry } from '../types/session.ts';

/**
 * Outbox for finished workouts that couldn't be saved (offline, flaky network).
 *
 * Each item is a complete session with client-generated ids, so syncing is an
 * idempotent upsert: a retry after a half-finished attempt never duplicates
 * data, and entries can't arrive before their session.
 */

const DB_NAME = 'ryng_offline_queue';
const STORE_NAME = 'sessions';
const DB_VERSION = 2;

export type NewSession = Omit<Session, 'created_at'>;
export type NewSessionEntry = Omit<SessionEntry, 'session_id'> & { session_id: string };

export interface PendingSession {
  id: string;
  session: NewSession;
  entries: NewSessionEntry[];
  queuedAt: number;
  attempts: number;
  lastError?: string;
}

function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // v1 held a generic mutation store that was never used — drop it.
      if (db.objectStoreNames.contains('mutations')) db.deleteObjectStore('mutations');
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
}

/** True for errors that mean "no connection", as opposed to a rejected request. */
export function isNetworkError(err: unknown): boolean {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
  const msg = err instanceof Error ? err.message : typeof err === 'object' && err && 'message' in err ? String((err as { message: unknown }).message) : String(err);
  return /failed to fetch|networkerror|network request failed|load failed|fetch failed|timeout/i.test(msg);
}

/** Write one session and its entries. Idempotent thanks to client-side ids. */
export async function pushSession(session: NewSession, entries: NewSessionEntry[]): Promise<void> {
  const { error: sessionError } = await supabase.from('sessions').upsert(session, { onConflict: 'id' });
  if (sessionError) throw sessionError;

  if (entries.length > 0) {
    const { error: entriesError } = await supabase.from('session_entries').upsert(entries, { onConflict: 'id' });
    if (entriesError) throw entriesError;
  }

  // Best-effort; counts once per session server-side.
  supabase.rpc('increment_exercise_usage_for_session', { p_session_id: session.id })
    .then(null, (e) => logger.warn('Usage increment failed', { error: String(e) }));
}

export async function queueSession(session: NewSession, entries: NewSessionEntry[], error?: unknown): Promise<void> {
  const db = await getDB();
  const item: PendingSession = {
    id: session.id,
    session,
    entries,
    queuedAt: Date.now(),
    attempts: 0,
    lastError: error ? String(error instanceof Error ? error.message : error) : undefined,
  };
  await db.put(STORE_NAME, item);
}

/**
 * Try to sync every queued session. Items are kept (never discarded) until
 * they succeed, so no workout is silently lost. Returns the number synced.
 */
export async function flush(): Promise<number> {
  let synced = 0;
  let db;
  try {
    db = await getDB();
  } catch (e) {
    logger.warn('Offline queue unavailable', { error: String(e) });
    return 0;
  }

  const all = (await db.getAll(STORE_NAME)) as PendingSession[];
  all.sort((a, b) => a.queuedAt - b.queuedAt);

  for (const item of all) {
    try {
      await pushSession(item.session, item.entries);
      await db.delete(STORE_NAME, item.id);
      synced++;
    } catch (e) {
      await db.put(STORE_NAME, { ...item, attempts: item.attempts + 1, lastError: String(e instanceof Error ? e.message : e) });
      if (isNetworkError(e)) break; // still offline — try again later
      logger.warn('Offline queue: session sync failed', { id: item.id, attempts: item.attempts + 1, error: String(e) });
    }
  }
  return synced;
}

export async function pendingCount(): Promise<number> {
  try {
    const db = await getDB();
    return await db.count(STORE_NAME);
  } catch {
    return 0;
  }
}
