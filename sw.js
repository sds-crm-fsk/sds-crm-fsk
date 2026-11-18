const VERSION = 'v32'; // <-- ОБЯЗАТЕЛЬНО МЕНЯЙТЕ ПРИ КАЖДОМ ОБНОВЛЕНИИ HTML!
const CACHE_NAME = `sds-crm-${VERSION}`;

const APP_STATIC_RESOURCES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Заставляет новый SW встать на место старого сразу
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_STATIC_RESOURCES))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) return caches.delete(cache);
        })
      );
    }).then(() => self.clients.claim()) // Применяет изменения к открытым вкладкам
  );
});

self.addEventListener('fetch', (event) => {
  // Не перехватываем запросы к Google Apps Script (база данных)
  if (event.request.url.includes('script.google.com')) return;

  // Стратегия "Сеть в первую очередь, кэш — если нет сети"
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Если сеть есть, обновляем кэш и отдаем свежий файл
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      })
      .catch(() => {
        // Если сети нет, отдаем из кэша
        return caches.match(event.request);
      })
  );
});