// sw.js
const CACHE_NAME = 'peer-review-cache-v2';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './js/AppController.js',
  './js/managers/ArticleManager.js',
  './js/managers/SyncManager.js',
  './js/storage/ArticleStorage.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Guardando archivos estáticos en caché');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// FASE DE ACTIVACIÓN
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Borrando caché antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 5. FASE DE INTERCEPCIÓN
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si hay internet, devolvemos el archivo más nuevo
        return response;
      }).catch(() => {
        // Si falla la red (Modo Offline), buscamos en el caché
        console.log('[Service Worker] Sin conexión, cargando desde el caché:', event.request.url);
        return caches.match(event.request);
      })
  );
});
