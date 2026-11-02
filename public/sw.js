// Service Worker mínimo para habilitar instalación PWA (Progressive Web App)
const CACHE_NAME = 'bodeguita-pwa-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Passthrough a la red
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});

