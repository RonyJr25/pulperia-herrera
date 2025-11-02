const CACHE_NAME = 'pulperia-cache-v2';
const urlsToCache = [
  '/brenda/brenda.html',
  '/brenda/manifest.json',
  '/brenda/sw.js',
  '/brenda/eae4d03afd74c392c2e7e1daf0a138f1-insignia-de-cerveza-artesanal.webp',
  '/brenda/fd66f9_606256f553c54676ab74c2d4fff75d45~mv2.png',
  
];

// Instalación y cacheo
self.addEventListener('install', event => {
  console.log('[SW] Instalando y cacheando archivos...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Activación y limpieza de cachés antiguas
self.addEventListener('activate', event => {
  console.log('[SW] Activado y limpiando cachés antiguas...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Manejo de fetch para offline
self.addEventListener('fetch', event => {
  // Ignorar requests inválidos (extensiones)
  const url = event.request.url;
  if (url.startsWith('chrome-extension://') || url.startsWith('chrome://')) return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request)
        .then(networkResponse => {
          // Solo cachear respuestas válidas GET
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone(); // ✅ clonar antes de poner en cache

          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache).catch(err => {
              console.warn('[SW] No se pudo guardar en caché:', event.request.url, err);
            });
          });

          return networkResponse;
        })
        .catch(() => {
          // Si no hay conexión y es navegación, servir brenda.html
          if (event.request.mode === 'navigate') {
            return caches.match('/brenda/brenda.html');
          }
        });
    })
  );
});

