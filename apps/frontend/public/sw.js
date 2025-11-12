self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('wetime-v1').then((cache) => cache.addAll([
      '/',
      '/manifest.json'
    ]))
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request).then((res) => {
        const copy = res.clone();
        caches.open('wetime-v1').then((cache) => cache.put(event.request, copy));
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});

