// Nombre de la caché
const CACHE_NAME = 'buscador-ley-transito-v1.1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  './favicon.ico'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache abierta');
        // Usamos Promise.all para manejar errores individuales
        return Promise.all(
          ASSETS_TO_CACHE.map(url => {
            return fetch(url, { mode: 'no-cors' })
              .then(response => {
                if (!response.ok) {
                  throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
                }
                return cache.put(url, response);
              })
              .catch(err => {
                console.warn(`Couldn't cache ${url}:`, err);
              });
          })
        );
      })
      .catch(err => {
        console.error('Error during service worker installation:', err);
      })
  );
  // Activar el nuevo service worker inmediatamente
  self.skipWaiting();
});

// Estrategia: Cache First, luego red
self.addEventListener('fetch', (event) => {
  // No cachear solicitudes de navegación que no sean GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Para solicitudes de navegación, usa index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html')
        .then((cachedResponse) => {
          return cachedResponse || fetch(event.request);
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Si la respuesta está en caché, devuélvela
        if (cachedResponse) {
          return cachedResponse;
        }

        // Si no está en caché, haz la petición a la red
        return fetch(event.request)
          .then((networkResponse) => {
            // Solo cachear respuestas exitosas y que sean de nuestro dominio
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Clonar la respuesta para almacenarla en caché
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          });
      })
  );
});

// Limpieza de cachés antiguas
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('Eliminando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Tomar el control de los clientes inmediatamente
  event.waitUntil(clients.claim());
});
