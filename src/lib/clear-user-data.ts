import { cacheClear } from './idb-cache.ts';
import { useTimerStore } from '../stores/timer-store.ts';
import { useSessionStore } from '../stores/session-store.ts';
import { useGymStore } from '../stores/gym-store.ts';

/**
 * Remove everything cached for the signed-in user from this device, so the
 * next person using it (shared phone, family tablet) never sees their data.
 * The offline outbox is kept: it only syncs for its own user (see offline-queue).
 */
export async function clearUserData() {
  useTimerStore.getState().reset();
  useSessionStore.getState().reset();
  useGymStore.getState().reset();

  await Promise.all(
    (['plans', 'plan_days', 'plan_exercises', 'presets', 'mesocycle'] as const).map((s) => cacheClear(s)),
  );

  // Supabase responses cached by the service worker (NetworkFirst 'api-cache')
  if (typeof caches !== 'undefined') {
    await caches.delete('api-cache').catch(() => false);
  }
}
