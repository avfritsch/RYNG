import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'ryng_cache';
const DB_VERSION = 1;

interface RyngCacheDB {
  plans: { key: string; value: unknown };
  plan_days: { key: string; value: unknown };
  plan_exercises: { key: string; value: unknown };
  presets: { key: string; value: unknown };
  mesocycle: { key: string; value: unknown };
}

let dbPromise: Promise<IDBPDatabase<RyngCacheDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<RyngCacheDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('plans')) db.createObjectStore('plans');
        if (!db.objectStoreNames.contains('plan_days')) db.createObjectStore('plan_days');
        if (!db.objectStoreNames.contains('plan_exercises')) db.createObjectStore('plan_exercises');
        if (!db.objectStoreNames.contains('presets')) db.createObjectStore('presets');
        if (!db.objectStoreNames.contains('mesocycle')) db.createObjectStore('mesocycle');
      },
    });
  }
  return dbPromise;
}

type StoreName = 'plans' | 'plan_days' | 'plan_exercises' | 'presets' | 'mesocycle';

/**
 * Cache data under a store + key.
 */
export async function cacheSet(store: StoreName, key: string, value: unknown) {
  try {
    const db = await getDB();
    await db.put(store, value, key);
  } catch (e) {
    console.warn('IDB cache error:', e);
  }
}

/**
 * Read cached data.
 */
export async function cacheGet<T>(store: StoreName, key: string): Promise<T | undefined> {
  try {
    const db = await getDB();
    return await db.get(store, key) as T | undefined;
  } catch (e) {
    console.warn('IDB cache error:', e);
    return undefined;
  }
}

/**
 * Delete a cache entry.
 */
export async function cacheDel(store: StoreName, key: string) {
  try {
    const db = await getDB();
    await db.delete(store, key);
  } catch (e) {
    console.warn('IDB cache error:', e);
  }
}

/**
 * Clear an entire store.
 */
export async function cacheClear(store: StoreName) {
  try {
    const db = await getDB();
    await db.clear(store);
  } catch (e) {
    console.warn('IDB cache error:', e);
  }
}
