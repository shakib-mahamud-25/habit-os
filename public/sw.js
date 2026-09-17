// Habit OS service worker — minimal, dependency-free offline shell.
// Strategy: cache-first for the app shell and static assets, with a
// background revalidation (stale-while-revalidate) so updates still
// arrive without ever blocking on the network.
const CACHE_NAME = 'habit-os-v1';
const APP_SHELL = ['/dashboard', '/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // never intercept cross-origin (fonts CDN, etc.)

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(req);
      const networkFetch = fetch(req)
        .then((res) => {
          if (res && res.status === 200) cache.put(req, res.clone());
          return res;
        })
        .catch(() => cached);

      if (cached) {
        // Stale-while-revalidate: serve cache instantly, refresh in background.
        networkFetch.catch(() => {});
        return cached;
      }
      // No cache yet — try network, and fall back to the dashboard shell
      // for navigations if fully offline on first visit to a new route.
      try {
        return await networkFetch;
      } catch {
        if (req.mode === 'navigate') return cache.match('/dashboard');
        throw new Error('offline and not cached');
      }
    })
  );
});
