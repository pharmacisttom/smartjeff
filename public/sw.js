const CACHE_NAME = 'smarto-v1';
const RUNTIME_CACHE = 'smarto-runtime-v1';

const PRECACHE_URLS = [
  '/',
  '/check-in',
  '/history',
  '/leave',
  '/payslip',
  '/chat',
  '/pending',
  '/offline',
  '/manifest.json',
];

// Install Event - Precache App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Network First for API, Cache First for Static, Offline Fallback for HTML
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET requests for SW caching
  if (request.method !== 'GET') return;

  // API requests -> Network First with 5s timeout
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .catch(() => {
          return new Response(JSON.stringify({ offline: true, message: 'Offline mode' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          });
        })
    );
    return;
  }

  // Static Assets -> Cache First
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|css|js)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(request).then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, responseClone));
          }
          return response;
        });
      })
    );
    return;
  }

  // HTML Pages -> Network First with Offline Fallback Page
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, responseClone));
        }
        return response;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) return cachedResponse;
        return caches.match('/offline');
      })
  );
});
