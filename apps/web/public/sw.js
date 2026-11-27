// Abundance Clinic OS - Minimal PWA Service Worker (network-first, no stale API caching)
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Network-first passthrough so real-time clinic & portal data is always fresh
  if (event.request.method !== 'GET') return;
  event.respondWith(fetch(event.request));
});
