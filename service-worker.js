// Nombre y versión de la caché
const CACHE_NAME = 'kcal-app-v1';

// Archivos para cachear
const urlsToCache = [
  '/',
  '/index.html',
  '/css/main.css',
  '/css/styles.css',
  '/css/results.css',
  '/css/base/reset.css',
  '/css/base/typography.css',
  '/css/base/variables.css',
  '/css/components/buttons.css',
  '/css/components/cards.css',
  '/css/components/forms.css',
  '/css/components/header.css',
  '/css/components/history.css',
  '/css/components/modals.css',
  '/css/components/results.css',
  '/css/layout/layout.css',
  '/js/main.js',
  '/img/favicon.ico',
  // Añadir aquí más recursos a cachear
];

// Instalar el service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caché abierta');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activar el service worker
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Estrategia de caché: Cache first, then network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si está en caché, devolver desde caché
        if (response) {
          return response;
        }
        // Si no está en caché, hacer la petición a la red
        return fetch(event.request)
          .then(response => {
            // Si la respuesta no es válida, devolver la respuesta
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Si es válida, clonar la respuesta para guardarla en caché
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          });
      })
  );
}); 