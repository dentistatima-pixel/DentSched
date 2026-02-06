
const CACHE_NAME = 'dentsched-v2';
const URLS_TO_CACHE = [
  '/',
  './index.html',
  './index.tsx',
  './manifest.json',
  './types.ts',
  './constants.ts',
  './App.tsx',
  // Key components
  './components/Layout.tsx',
  './components/Dashboard.tsx',
  './components/CalendarView.tsx',
  './components/PatientList.tsx',
  './components/PatientDetailView.tsx',
  // Tailwind CSS
  'https://cdn.tailwindcss.com',
  // Google Fonts
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  // Import map resources
  'https://aistudiocdn.com/react@^19.2.1',
  'https://aistudiocdn.com/react-dom@^19.2.1',
  'https://aistudiocdn.com/lucide-react@^0.555.0',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // Use addAll for atomic operation, but be aware it fails if any request fails.
        // For production, a more robust method might be needed.
        const cachePromises = URLS_TO_CACHE.map(urlToCache => {
            return cache.add(new Request(urlToCache, {cache: 'reload'})).catch(err => {
                console.warn(`Failed to cache ${urlToCache}:`, err);
            });
        });
        return Promise.all(cachePromises);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
    return;
  }
  
  // For navigation requests, try network first, then cache.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }
  
  // For other requests (CSS, JS, images), use a cache-first strategy.
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchResponse) => {
        // Optional: Cache new resources dynamically.
        // Be careful with this in production.
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, fetchResponse.clone());
          return fetchResponse;
        });
      });
    })
  );
});
