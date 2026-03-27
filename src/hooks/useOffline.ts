import { useState, useEffect } from 'react';
import { flush } from '../lib/offline-queue.ts';
import { toast } from '../stores/toast-store.ts';

export function useOffline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    async function handleOnline() {
      setIsOnline(true);
      try {
        const count = await flush();
        if (count > 0) toast.success(`${count} Änderungen synchronisiert`);
      } catch {
        // flush logs errors internally
      }
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Try flushing on mount if online
    if (navigator.onLine) {
      flush().catch(() => {});
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline };
}
