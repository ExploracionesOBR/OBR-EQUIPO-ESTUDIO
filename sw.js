/* OBR CAM PRO — sw.js físico v18 (Safari/iOS compatible) */
const CACHE = 'obr-cam-v18-core';
const RUNTIME = 'obr-cam-v18-runtime';
const CORE = ['./', './camara.html', './obr-logo.png', './obr-banner.png', './barrido.mp3', './respuesta.mp3'];
const CDN = ['cdn.tailwindcss.com','cdnjs.cloudflare.com','fonts.googleapis.com','fonts.gstatic.com','cdn.jsdelivr.net','unpkg.com','cdn.agora.io'];
const SKIP = ['api.groq.com','generativelanguage.googleapis.com','api.elevenlabs.io','api.voicerss.org','tile.openstreetmap.org'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.allSettled(CORE.map(u => c.add(u)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== RUNTIME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = e.request.url;
  if (SKIP.some(s => url.includes(s)) || url.includes('nc=')) return;
  const isCDN = CDN.some(c => url.includes(c));
  const local = url.startsWith(self.location.origin);
  if (!local && !isCDN) return;
  e.respondWith(
    caches.match(e.request).then(hit => {
      const reval = fetch(e.request).then(res => {
        if (res && res.status === 200) { const cl = res.clone(); caches.open(isCDN ? RUNTIME : CACHE).then(c => c.put(e.request, cl)); }
        return res;
      }).catch(() => null);
      if (hit) { return hit; }                       // cache-first + revalidación en fondo
      return reval.then(res => res || caches.match('./camara.html'));
    })
  );
});
