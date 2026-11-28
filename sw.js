const CACHE_NAME = 'rentarent-v2.03';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.jpg',
  '/rentarent_logo.jpg',
  '/css/core.css',
  '/css/layout.css',
  '/css/components.css',
  '/css/dashboard.css',
  '/css/propiedades.css',
  '/css/reservas.css',
  '/css/gastos.css',
  '/css/reportes.css',
  '/css/finanzas.css',
  '/js/core.js',
  '/js/storage.js',
  '/js/ui.js',
  '/js/calendario.js',
  '/js/finanzas.js',
  '/js/propiedades.js',
  '/js/reservas.js',
  '/js/gastos.js',
  '/js/dashboard.js',
  '/js/reportes.js',
  '/js/licencia.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});



