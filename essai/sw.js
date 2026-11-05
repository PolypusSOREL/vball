// Service worker de la VERSION D'ESSAI (dossier essai/). Indépendant de la version
// principale : son propre cache, qu'il est seul à gérer. Les stats restent dans le
// téléphone (localStorage, clé vb40), séparées de celles de la version principale.
//
// Pour publier une nouvelle version d'essai : changer le numéro ci-dessous.
var CACHE = 'vball-essai-v4.0-15';
var FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  '../icons/apple-touch-icon.png',
  '../icons/icon-192.png',
  '../icons/icon-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { // cache:'reload' : on va chercher les fichiers neufs sur le serveur (GitHub garde
    // une copie 10 minutes dans le navigateur, ce qui installait parfois l'ancienne version)
    return c.addAll(FILES.map(function (u) { return new Request(u, { cache: 'reload' }); })); }));
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      // ne touche qu'aux anciens caches de la version d'essai
      return Promise.all(keys.filter(function (k) { return k.indexOf('vball-essai-') === 0 && k !== CACHE; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  e.respondWith(
    caches.open(CACHE).then(function (c) {
      return c.match(e.request, { ignoreSearch: true }).then(function (hit) {
        var net = fetch(e.request.url, { cache: 'no-cache' }).then(function (res) {
          if (res && res.ok) c.put(e.request, res.clone());
          return res;
        }).catch(function () { return hit || c.match('./index.html'); });
        return hit || net;
      });
    })
  );
});
