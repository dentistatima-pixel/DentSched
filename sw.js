self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  // Pass-through fetch handler to satisfy PWA requirements
  e.respondWith(fetch(e.request));
});