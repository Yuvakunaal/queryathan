/*
  Offline cache for Data Cleaning Quest. Registered only in production builds
  (src/registerServiceWorker.ts). The two tokens below are filled in by the
  Vite build (vite.config.ts).

  What is cached, and why:
  - /assets/*      hashed file names, so a cached copy is never stale: cache first.
  - /pyodide/*     the Python runtime, ~18 MB, fixed per Pyodide version: cache first,
                   in its own cache that is dropped when the version changes.
  - jsdelivr pandas/numpy wheels (the one allowed cross-origin fetch, pinned by
                   exact version in the URL): cache first, same version rule.
  - /datasets/*, /sounds/*  seed CSVs and keystroke recordings: cache first.
  - the page and /content/*.json (cases and rosters): network first, falling back to
                   the cache, so a deploy shows up straight away but a dropped
                   connection does not break the app.
  Everything else (other origins, non-GET requests) is left alone.
*/
const BUILD_ID = "__BUILD_ID__";
const PYODIDE_VERSION = "__PYODIDE_VERSION__";

const PAGES = `dcq-pages-${BUILD_ID}`;
const ASSETS = "dcq-assets";
const PYODIDE = `dcq-pyodide-${PYODIDE_VERSION}`;
const KEEP = new Set([PAGES, ASSETS, PYODIDE]);
const CDN_ORIGIN = "https://cdn.jsdelivr.net";

self.addEventListener("install", () => {
  void self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys()) {
        if (name.startsWith("dcq-") && !KEEP.has(name)) await caches.delete(name);
      }
      await self.clients.claim();
    })(),
  );
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok) void cache.put(request, response.clone());
  return response;
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) void cache.put(request, response.clone());
    return response;
  } catch (error) {
    const hit = await cache.match(request);
    if (hit) return hit;
    throw error;
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (url.origin === CDN_ORIGIN) {
    if (url.pathname.startsWith("/pyodide/")) {
      event.respondWith(cacheFirst(request, PYODIDE));
    }
    return;
  }
  if (url.origin !== self.location.origin) return;

  if (
    url.pathname.startsWith("/assets/") ||
    url.pathname.startsWith("/datasets/") ||
    url.pathname.startsWith("/sounds/")
  ) {
    event.respondWith(cacheFirst(request, ASSETS));
  } else if (url.pathname.startsWith("/pyodide/")) {
    event.respondWith(cacheFirst(request, PYODIDE));
  } else if (
    url.pathname === "/" ||
    url.pathname.startsWith("/content/") ||
    url.pathname === "/index.html"
  ) {
    event.respondWith(networkFirst(request, PAGES));
  }
});
