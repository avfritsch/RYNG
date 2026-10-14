import { useState, useEffect } from 'react';
import { flush } from '../lib/offline-queue.ts';
import { toast } from '../stores/toast-store.ts';

/** Sync workouts that were saved while offline. */
async function syncPending() {
  try {
    const count = await flush();
    if (count > 0) {
      toast.success(count === 1 ? 'Offline-Training synchronisiert' : `${count} Offline-Trainings synchronisiert`);
    }
  } catch {
    // flush logs errors internally
  }
}

export function useOffline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      void syncPending();
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (navigator.onLine) void syncPending();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline };
}
