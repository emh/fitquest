const APP_SHELL_CACHE = "fitquest-app-shell-v3";
const RUNTIME_CACHE = "fitquest-runtime-v2";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./script.js",
  "./site.webmanifest",
  "./assets/fonts/ClimateCrisis-Regular.woff2",
  "./icons/favicon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
];
const ACTIVE_CACHES = new Set([APP_SHELL_CACHE, RUNTIME_CACHE]);
const CORE_ASSET_URLS = new Set(CORE_ASSETS.map((asset) => new URL(asset, self.location.href).href));

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(precacheCoreAssets());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheKeys = await caches.keys();
      await Promise.all(
        cacheKeys
          .filter((key) => key.startsWith("fitquest-") && !ACTIVE_CACHES.has(key))
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    if (request.mode === "navigate") {
      event.respondWith(serveAppShell(request));
      return;
    }

    if (CORE_ASSET_URLS.has(url.href)) {
      event.respondWith(staleWhileRevalidate(request, APP_SHELL_CACHE));
      return;
    }

    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
    return;
  }

});

async function precacheCoreAssets() {
  const cache = await caches.open(APP_SHELL_CACHE);
  await cache.addAll(CORE_ASSETS);
}

async function serveAppShell(request) {
  const cache = await caches.open(APP_SHELL_CACHE);
  const cachedPage = await cache.match("./index.html");
  const networkPromise = fetch(request)
    .then(async (response) => {
      if (isCacheableResponse(response)) {
        await cache.put("./index.html", response.clone());
      }

      return response;
    })
    .catch(() => null);

  if (cachedPage) {
    return cachedPage;
  }

  const networkResponse = await networkPromise;

  if (networkResponse) {
    return networkResponse;
  }

  throw new Error(`No cached app shell available for ${request.url}`);
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request, { ignoreSearch: true });
  const networkPromise = fetch(request)
    .then(async (response) => {
      if (isCacheableResponse(response)) {
        await cache.put(request, response.clone());
      }

      return response;
    })
    .catch(() => null);

  if (cachedResponse) {
    return cachedResponse;
  }

  const networkResponse = await networkPromise;

  if (networkResponse) {
    return networkResponse;
  }

  if (request.mode === "navigate") {
    const fallbackPage = await cache.match("./index.html");

    if (fallbackPage) {
      return fallbackPage;
    }
  }

  throw new Error(`No cached response available for ${request.url}`);
}

function isCacheableResponse(response) {
  return Boolean(response) && (response.ok || response.type === "opaque");
}
