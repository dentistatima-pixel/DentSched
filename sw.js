const CACHE_NAME = 'dentsched-cache-v2';
const urlsToCache = [
  '/',
  '/index.html',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Navigation Fallback: Redirect all page navigation requests to index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html').then(response => {
        return response || fetch(event.request);
      })
    );
    return;
  }

  // Standard Cache-First for static assets
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});