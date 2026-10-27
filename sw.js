// Service worker : garde une copie de l'appli dans le téléphone pour qu'elle
// s'ouvre sans Internet (gymnase). Les stats, elles, restent dans le téléphone
// (localStorage) et ne passent jamais par Internet.
//
// Pour publier une nouvelle version : changer le numéro ci-dessous.
var CACHE = 'vball-v3.8-1';
var FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }));
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

// Copie locale d'abord (instantané, marche hors-ligne), puis mise à jour
// discrète en arrière-plan quand Internet est disponible.
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  e.respondWith(
    caches.open(CACHE).then(function (c) {
      return c.match(e.request, { ignoreSearch: true }).then(function (hit) {
        var net = fetch(e.request).then(function (res) {
          if (res && res.ok) c.put(e.request, res.clone());
          return res;
        }).catch(function () { return hit || c.match('./index.html'); });
        return hit || net;
      });
    })
  );
});
