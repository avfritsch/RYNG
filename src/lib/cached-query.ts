import { cacheSet, cacheGet } from './idb-cache.ts';

type StoreName = 'plans' | 'plan_days' | 'plan_exercises' | 'presets' | 'mesocycle';

/**
 * Wraps a Supabase query function to cache results in IndexedDB.
 * On network failure, returns cached data as fallback.
 */
export function withCache<T>(
  store: StoreName,
  key: string,
  queryFn: () => Promise<T>,
): () => Promise<T> {
  return async () => {
    try {
      const data = await queryFn();
      // Cache on success
      cacheSet(store, key, data);
      return data;
    } catch (err) {
      // If offline, try cache fallback
      if (!navigator.onLine) {
        const cached = await cacheGet<T>(store, key);
        if (cached !== undefined) return cached;
      }
      throw err;
    }
  };
}
