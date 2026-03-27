import { openDB } from 'idb';
import { supabase } from './supabase.ts';

const DB_NAME = 'ryng_offline_queue';
const STORE_NAME = 'mutations';
const DB_VERSION = 1;

const ALLOWED_TABLES = ['plans', 'plan_days', 'plan_exercises', 'presets', 'sessions', 'session_entries', 'mesocycle_config'] as const;

export interface QueuedMutation {
  id: string;
  table: string;
  operation: 'insert' | 'update' | 'delete';
  data: Record<string, unknown>;
  match?: Record<string, unknown>;
  timestamp: number;
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
export async function enqueue(mutation: Omit<QueuedMutation, 'id' | 'timestamp'>) {
  if (!ALLOWED_TABLES.includes(mutation.table as typeof ALLOWED_TABLES[number])) {
    console.error(`Offline queue: invalid table "${mutation.table}"`);
    return;
  }
  try {
    const db = await getDB();
    const entry: QueuedMutation = {
      ...mutation,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    await db.put(STORE_NAME, entry);
  } catch {
    // IndexedDB not available
  }
}

/**
 * Flush all queued mutations to Supabase.
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
      } catch {
        // Stop on first failure — remaining mutations stay queued
        break;
      }
    }
  } catch {
    // IndexedDB not available
  }
  return flushed;
}

async function executeMutation(m: QueuedMutation) {
  switch (m.operation) {
    case 'insert': {
      const { error } = await supabase.from(m.table).insert(m.data);
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
  } catch {
    return 0;
  }
}
