const CACHE_PREFIX = 'recibocondo-';
const CACHE_NAME = 'recibocondo-v165-splash-native-css';
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
  let injected = text;
  if (!injected.includes('multidesktop-sync.js')) {
    injected = injected.replace('</body>', '<script src="./multidesktop-sync.js"></script>\n</body>');
  }
  if (!injected.includes('rc-splash-native-v165')) {
    const splashCss = '<style id="rc-splash-native-v165">' +
      '#rcDynamicSplash .rc-card{width:min(84vw,390px)!important;padding:18px!important;transform:none!important;margin:auto!important;text-align:center!important}' +
      '#rcDynamicSplash .rc-icon-wrap{width:clamp(82px,8vw,108px)!important;height:clamp(82px,8vw,108px)!important;margin:0 auto 15px!important;filter:drop-shadow(0 16px 30px rgba(0,0,0,.38))!important}' +
      '#rcDynamicSplash h1{font-size:clamp(30px,3.2vw,42px)!important;line-height:1.02!important;letter-spacing:-.045em!important;margin:0!important}' +
      '#rcDynamicSplash .rc-line{width:min(54vw,280px)!important;margin:13px auto 11px!important}' +
      '#rcDynamicSplash .rc-sub{font-size:clamp(9px,1vw,11px)!important;letter-spacing:.19em!important;line-height:1.5!important}' +
      '#rcDynamicSplash .rc-load-label{margin-top:24px!important;font-size:13px!important}' +
      '#rcDynamicSplash .rc-progress{width:min(54vw,280px)!important;height:6px!important;margin:11px auto 7px!important}' +
      '@media(max-width:640px){#rcDynamicSplash .rc-card{width:min(88vw,320px)!important;padding:12px 12px 16px!important;transform:none!important}#rcDynamicSplash .rc-icon-wrap{width:76px!important;height:76px!important;margin-bottom:12px!important}#rcDynamicSplash h1{font-size:30px!important;line-height:1.02!important}}' +
      '</style>';
    injected = injected.replace('</head>', splashCss + '\n</head>');
  }
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
