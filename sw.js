// Service Worker · Hazard HSE
// Cachea el "shell" de la app para que cargue sin conexión.
const CACHE = 'hazard-hse-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
];
 
// Instalar: precachear el shell
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});
 
// Activar: limpiar cachés viejos
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});
 
// Fetch: red primero para llamadas a Supabase; cache primero para el shell.
self.addEventListener('fetch', (e) => {
  const url = e.request.url;
  // Nunca cachear llamadas a la API/funciones (siempre red)
  if (url.includes('supabase.co') || url.includes('powerplatform.com')) {
    return; // deja pasar a la red normalmente
  }
  // Para navegación y assets: intenta cache, si no red, y guarda copia
  e.respondWith(
    caches.match(e.request).then((cached) =>
      cached ||
      fetch(e.request).then((resp) => {
        // Guardar copia de respuestas GET válidas del mismo origen
        if (e.request.method === 'GET' && resp.ok && url.startsWith(self.location.origin)) {
          const copy = resp.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return resp;
      }).catch(() => caches.match('./index.html')) // fallback offline
    )
  );
});
