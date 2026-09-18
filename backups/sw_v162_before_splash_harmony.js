const CACHE_PREFIX = 'recibocondo-';
const CACHE_NAME = 'recibocondo-v163-refresh-session';
const APP_SCOPE = '/ReciboCondo/';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './favicon.ico',
  './apple-touch-icon.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-maskable-192.png',
  './assets/icons/icon-maskable-512.png',
  './multidesktop-sync.js'
];

async function injectSyncPatch(response) {
  if (!response || !response.ok) return response;
  const type = response.headers.get('content-type') || '';
  if (!type.includes('text/html')) return response;
  const text = await response.text();
  const injected = text.includes('multidesktop-sync.js')
    ? text
    : text.replace('</body>', '<script src="./multidesktop-sync.js"></script>\n</body>');
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  return new Response(injected, { status: response.status, statusText: response.statusText, headers });
}

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      await cache.addAll(APP_SHELL).catch(() => Promise.resolve());
      const index = await cache.match('./index.html');
      if (index) await cache.put('./index.html', await injectSyncPatch(index));
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys
        .filter(k => k.startsWith(CACHE_PREFIX) && k !== CACHE_NAME)
        .map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET') return;

  // Nunca interceptar outros apps hospedados na mesma origem GitHub Pages.
  if (url.origin === self.location.origin && !url.pathname.startsWith(APP_SCOPE)) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then(async response => {
        const patched = await injectSyncPatch(response);
        const copy = patched.clone();
        caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copy));
        return patched;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy)).catch(() => {});
        return response;
      }).catch(() => cached);
    })
  );
});
