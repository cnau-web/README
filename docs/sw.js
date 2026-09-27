/* Service worker : la carte reste disponible sans réseau.
   Le nom du cache change à chaque modification du contenu, ce qui déclenche
   la bannière « nouvelle version » au lieu de servir une page périmée. */
const VERSION = '24210906c079';
const CACHE = 'carte-' + VERSION;
const FICHIERS = ['./', './index.html', './manifest.webmanifest',
                  './icone-192.png', './icone-512.png', './icone-180.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FICHIERS)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('message', (e) => { if (e.data === 'passe') self.skipWaiting(); });

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== location.origin) return;   // polices : réseau seul
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req)
      .then((r) => { const copie = r.clone();
                     caches.open(CACHE).then((c) => c.put('./index.html', copie)); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(req).then((r) => r || fetch(req)));
});
