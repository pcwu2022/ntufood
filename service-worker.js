
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('ntufood-cache-v1').then(cache => {
      return cache.addAll([
        './index.html',
        './index.js',
        'frontend/style.css',
        'frontend/icon.png',
        'frontend/ntufood_logo.png'
      ]);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
