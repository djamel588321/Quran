// Service worker v2: the page itself (index.html) is now NETWORK-FIRST, so
// every future update you upload shows immediately on next load. Only the
// static assets (icons, manifest) stay cache-first for offline speed.
// Bumping CACHE_NAME here also forces old cached copies to be thrown away.
const CACHE_NAME = 'rihlati-v2';
const APP_SHELL = ['./manifest.json', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
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
  const isHTMLPage = req.mode === 'navigate' || req.url.endsWith('.html') || req.url.endsWith('/');

  if (isHTMLPage) {
    // Network-first: always try to get the freshest page; only use cache if offline.
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        return res;
      }).catch(() => caches.match(req))
    );
  } else {
    // Static assets: cache-first for speed, network fallback.
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req))
    );
  }
});
