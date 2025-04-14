const CACHE_NAME = "cardrandomizer-cache-v1";

const URLS_TO_CACHE = [
  "./",
  "./index.html",
  "./index.css",
  "./index.js",
  "./runtime.js",
  "./manifest.json",
  "./icons/128x128.png",
  "./icons/512x512.png",


  "./js/uikit-icons.js",
  "./js/uikit-icons.min.js",
  "./js/uikit.js",
  "./js/uikit.min.js",


  "./css/uikit-rtl.css",
  "./css/uikit-rtl.min.css",
  "./css/uikit.css",
  "./css/uikit.min.css",
];

self.addEventListener("fetch", (event) => {
  if (
    event.request.url.endsWith("favicon.ico") ||
    new URL(event.request.url).origin !== self.location.origin
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          } else {
            console.warn("Не удалось получить из сети и кеша:", event.request.url);
          }
        });
      })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});