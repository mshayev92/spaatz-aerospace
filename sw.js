const CACHE_NAME = "spaatz-study-v2";

// Precached so the app opens offline. index.html and data.json are in here as
// the offline fallback, but at runtime they're fetched network-first (below) so
// a redeployed deck shows up on the very next load rather than the one after.
const SHELL_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./data.json",
  "./icons/icon-32.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

// Content that must reflect the latest deploy: served network-first.
const FRESH_PATHS = [/\/$/, /\/index\.html$/, /\/data\.json$/];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

function cachePut(req, res) {
  if (res && res.ok) {
    const copy = res.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
  }
  return res;
}

// progress.json (and any non-GET/cross-origin request, e.g. the GitHub API) is
// never precached or served from cache here -- the app always needs a live
// network read of it to know the real sync state, and already handles a
// failed fetch (offline) gracefully on its own.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith("/progress.json")) return;

  if (FRESH_PATHS.some((re) => re.test(url.pathname))) {
    // Network-first: newest deploy wins, cache is the offline fallback.
    event.respondWith(
      fetch(req)
        .then((res) => cachePut(req, res))
        .catch(() => caches.match(req).then((cached) => cached || caches.match("./index.html")))
    );
    return;
  }

  // Everything else (icons, manifest): cache-first, refreshed in the
  // background so the next load picks up any change.
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req).then((res) => cachePut(req, res)).catch(() => cached);
      return cached || network;
    })
  );
});
