const CACHE_NAME = 'videoplus-v1';
const STATIC_CACHE = 'videoplus-static-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/api.js',
  '/js/player.js',
  '/js/app.js',
  '/pages/watch.html',
  '/pages/category.html',
  '/pages/channel.html',
  '/pages/search.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== STATIC_CACHE)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.pathname.startsWith('/api/') || url.hostname !== self.location.hostname) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && request.method === 'GET') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  event.respondWith(
    caches
      .match(request)
      .then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok && request.method === 'GET') {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
      .catch(() => {
        if (request.destination === 'document') {
          return caches.match('/index.html');
        }
      })
  );
});
