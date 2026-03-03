// sw.js

// 1. Nombre y versión de nuestro caché
const CACHE_NAME = 'peer-review-cache-v1';

// 2. Archivos estáticos que componen el "App Shell" (Lo necesario para que la UI cargue)
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './js/AppController.js',
  './js/ArticleManager.js',
  './js/ArticleStorage.js'
];

// 3. FASE DE INSTALACIÓN
// Se ejecuta la primera vez que el navegador detecta este archivo.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Guardando archivos estáticos en caché');
        return cache.addAll(urlsToCache);
      })
  );
  // Fuerza al Service Worker a activarse inmediatamente
  self.skipWaiting();
});

// 4. FASE DE ACTIVACIÓN
// Se ejecuta cuando el SW toma el control. Útil para limpiar cachés viejos si cambias la versión.
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

// 5. FASE DE INTERCEPCIÓN (Estrategia: Cache First / Primero el Caché)
// Cada vez que la página pide un archivo (HTML, JS, CSS) o hace un fetch, pasa por aquí.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Si el archivo está en el caché, lo devolvemos inmediatamente (¡funciona sin internet!)
        if (response) {
          return response;
        }
        // Si no está en el caché, intentamos ir a internet a buscarlo
        return fetch(event.request);
      }).catch(() => {
        // Aquí podríamos devolver una página "offline.html" de repuesto en el futuro
        console.log('[Service Worker] Falló la petición y no hay caché para:', event.request.url);
      })
  );
});