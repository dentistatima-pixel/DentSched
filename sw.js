const CACHE_NAME = 'dentsched-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Navigation requests (like launching the app) should ideally hit the network
  // and satisfy the PWA capability check.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Fallback or simple error handling if offline
        return new Response("Offline mode active. Please check connection.");
      })
    );
    return;
  }

  // Standard asset fetch
  event.respondWith(
    fetch(event.request).catch(() => {
      // Return nothing or a placeholder for assets if offline
    })
  );
});