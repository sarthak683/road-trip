/* Road Trip service worker — offline-first for the dead-zone stretches.
   Core app shell is precached; tiles, fonts, and photos are cached as you
   view them online, then served from cache when you lose signal. */
var CACHE = 'roadtrip-v3';
var CORE = ['./', 'index.html', 'bay.html', 'manifest.json', 'icon.svg'];
// Cross-origin assets to grab on install so offline is complete after one online visit.
var EXTRA = [
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Quite_possibly_the_most_awesome_road_in_America_4892213989.jpg?width=1100',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Eisenhower_Tunnel2.JPG?width=900',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Glenwood_Canyon_I-70.JPG?width=900',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Salt_Flats_Hexagons_and_Leading_Lines.jpg?width=1100',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Donner_Lake_as_seen_from_Donner_Pass.jpg?width=1100',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Thomas%20Canyon%20wildflowers%2C%20Ruby%20Mountains%2C%20Nevada%20%2823205919229%29.jpg?width=1100',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Reno%20Arch%2C%20Reno%2C%20Nevada.jpg?width=1100',
  'https://commons.wikimedia.org/wiki/Special:FilePath/View%20from%20Mission%20Peak%2C%20California.jpg?width=1100'
];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) {
    var core = c.addAll(CORE).catch(function () {});
    var extra = Promise.all(EXTRA.map(function (u) {
      return fetch(new Request(u, { mode: 'no-cors' })).then(function (r) { return c.put(u, r); }).catch(function () {});
    }));
    return Promise.all([core, extra]);
  }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { if (k !== CACHE) return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  // App shell: network-first so updates land, fall back to cached page offline.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(function (r) {
        var copy = r.clone();
        caches.open(CACHE).then(function (c) { c.put('index.html', copy); });
        return r;
      }).catch(function () {
        return caches.match(req).then(function (m) { return m || caches.match('index.html') || caches.match('./'); });
      })
    );
    return;
  }

  // Everything else (Leaflet, fonts, map tiles, photos): cache-first, then fill.
  e.respondWith(
    caches.match(req).then(function (cached) {
      if (cached) return cached;
      return fetch(req).then(function (r) {
        try {
          var copy = r.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        } catch (_) {}
        return r;
      }).catch(function () { return cached; });
    })
  );
});
