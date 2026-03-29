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
