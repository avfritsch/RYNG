/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { StaleWhileRevalidate, NetworkFirst, NetworkOnly } from 'workbox-strategies';

declare let self: ServiceWorkerGlobalScope;

// Precache Vite-generated assets
precacheAndRoute(self.__WB_MANIFEST);

// Google Fonts: stale-while-revalidate
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
  new StaleWhileRevalidate({ cacheName: 'google-fonts' }),
);

// Supabase API: network-first with 3s timeout
registerRoute(
  ({ url }) => url.hostname.endsWith('.supabase.co'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 3,
  }),
);

// Offline fallback for navigation requests
const navigationHandler = new NetworkOnly();
const navigationRoute = new NavigationRoute(navigationHandler, {
  // Use offline.html as fallback when network fails and no cache exists
});

navigationRoute.setCatchHandler(async () => {
  const cache = await caches.open('offline-fallback');
  const cached = await cache.match('/offline.html');
  if (cached) return cached;
  return Response.error();
});

registerRoute(navigationRoute);

// Pre-cache offline.html on install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('offline-fallback').then((cache) => cache.add('/offline.html')),
  );
});

// Push notification handler
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const { title, body, icon, url } = data;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: icon || '/ryng-r-192.png',
      badge: '/ryng-r-48.png',
      data: { url: url || '/' },
    }),
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      // Focus existing window if open
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      return self.clients.openWindow(url);
    }),
  );
});
