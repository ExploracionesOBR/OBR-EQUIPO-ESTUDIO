const CACHE_NAME = 'obr-pwa-v1';

// Recursos críticos a guardar en la memoria del teléfono
const ASSETS_TO_CACHE = [
  './',
  './camara.html',
  './obr-logo.png'
  // Nota: No agregamos los .mp4 aquí porque son muy pesados para la caché inicial,
  // el navegador los manejará automáticamente.
];

// 1. INSTALACIÓN: Guardar los archivos iniciales en Caché
self.addEventListener('install', event => {
  self.skipWaiting(); // Fuerza a que el nuevo SW se active inmediatamente
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[OBR SW] Guardando recursos en caché local');
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
});

// 2. ACTIVACIÓN: Limpiar cachés viejas si actualizas la app
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('[OBR SW] Limpiando caché antigua:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. INTERCEPTOR DE RED (La magia contra los bloqueos de Datos Móviles)
// Estrategia: "Stale-While-Revalidate" (Usar caché instantánea, actualizar de fondo)
self.addEventListener('fetch', event => {
  // Ignorar peticiones a APIs externas (Gemini, Groq, PeerJS, etc)
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // Siempre intentamos descargar la versión más nueva de GitHub silenciosamente
      const fetchPromise = fetch(event.request).then(networkResponse => {
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, networkResponse.clone());
        });
        return networkResponse;
      }).catch(() => {
        console.log('[OBR SW] Sin conexión, usando solo caché.');
      });

      // Si tenemos el archivo en caché, lo devolvemos en 1 milisegundo (¡Salto de bloqueo!)
      // Si no, esperamos a que la red termine.
      return cachedResponse || fetchPromise;
    })
  );
});
