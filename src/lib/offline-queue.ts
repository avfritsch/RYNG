import { openDB } from 'idb';
import { supabase } from './supabase.ts';
import { logger } from './logger.ts';

const DB_NAME = 'ryng_offline_queue';
const STORE_NAME = 'mutations';
const DB_VERSION = 1;
const MAX_RETRIES = 3;

const ALLOWED_TABLES = ['plans', 'plan_days', 'plan_exercises', 'presets', 'sessions', 'session_entries', 'mesocycle_config'] as const;

export interface QueuedMutation {
  id: string;
  table: string;
  operation: 'insert' | 'update' | 'delete';
  data: Record<string, unknown>;
  match?: Record<string, unknown>;
  timestamp: number;
  retries?: number;
}

function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
}

/**
 * Enqueue a mutation for later execution.
 */
export async function enqueue(mutation: Omit<QueuedMutation, 'id' | 'timestamp' | 'retries'>) {
  if (!ALLOWED_TABLES.includes(mutation.table as typeof ALLOWED_TABLES[number])) {
    logger.error(`Offline queue: invalid table "${mutation.table}"`);
    return;
  }
  try {
    const db = await getDB();
    const entry: QueuedMutation = {
      ...mutation,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retries: 0,
    };
    await db.put(STORE_NAME, entry);
  } catch (e) {
    logger.warn('Offline queue enqueue error', { error: String(e) });
  }
}

/**
 * Flush all queued mutations to Supabase.
 * Skips permanently failed mutations instead of blocking the entire queue.
 */
export async function flush(): Promise<number> {
  let flushed = 0;
  try {
    const db = await getDB();
    const all = await db.getAll(STORE_NAME);
    // Sort by timestamp (oldest first)
    all.sort((a, b) => a.timestamp - b.timestamp);

    for (const mutation of all) {
      try {
        await executeMutation(mutation);
        await db.delete(STORE_NAME, mutation.id);
        flushed++;
      } catch (e) {
        const retries = (mutation.retries ?? 0) + 1;
        if (retries >= MAX_RETRIES) {
          // Permanently failed — discard to avoid blocking the queue
          logger.warn(`Offline queue: discarding mutation after ${MAX_RETRIES} retries`, { table: mutation.table, operation: mutation.operation, error: String(e) });
          await db.delete(STORE_NAME, mutation.id);
        } else {
          // Increment retry count and continue with next mutation
          await db.put(STORE_NAME, { ...mutation, retries });
          logger.warn(`Offline queue: retry ${retries}/${MAX_RETRIES}`, { table: mutation.table, operation: mutation.operation });
        }
        // Continue processing remaining mutations instead of stopping
      }
    }
  } catch (e) {
    logger.warn('Offline queue flush error', { error: String(e) });
  }
  return flushed;
}

async function executeMutation(m: QueuedMutation) {
  switch (m.operation) {
    case 'insert': {
      const { error } = await supabase.from(m.table).upsert(m.data);
      if (error) throw error;
      break;
    }
    case 'update': {
      let query = supabase.from(m.table).update(m.data);
      if (m.match) {
        for (const [key, value] of Object.entries(m.match)) {
          query = query.eq(key, value as string);
        }
      }
      const { error } = await query;
      if (error) throw error;
      break;
    }
    case 'delete': {
      let query = supabase.from(m.table).delete();
      if (m.match) {
        for (const [key, value] of Object.entries(m.match)) {
          query = query.eq(key, value as string);
        }
      }
      const { error } = await query;
      if (error) throw error;
      break;
    }
  }
}

/**
 * Get number of pending mutations.
 */
export async function pendingCount(): Promise<number> {
  try {
    const db = await getDB();
    return await db.count(STORE_NAME);
  } catch (e) {
    logger.warn('Offline queue count error', { error: String(e) });
    return 0;
  }
}
