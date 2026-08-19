const CACHE_NAME = 'pooja-finance-v1';
const ASSETS = [
  './index.html',
  './app.js',
  './database.js',
  './calculations.js',
  './components.js',
  './manifest.json',
  './views/dashboard.js',
  './views/add-loan.js',
  './views/person-details.js',
  './views/reports.js',
  './views/settings.js'
];

self.addEventListener('install', (evt) => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching app shell assets');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (evt) => {
  evt.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (evt) => {
  // Network first, falling back to cache
  evt.respondWith(
    fetch(evt.request)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(evt.request, resClone);
        });
        return res;
      })
      .catch(() => caches.match(evt.request))
  );
});
