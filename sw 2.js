/* GCS Scaffold Field Map — service worker */
const V = "gcs-fieldmap-v1";
const CORE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;                       // never touch writes
  const url = new URL(req.url);
  if (url.hostname.endsWith("supabase.co")) return;       // live data: network only

  // Navigations: network-first so index.html updates land immediately; cached shell offline
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then(res => { caches.open(V).then(c => c.put("./index.html", res.clone())); return res; })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Everything else (icons, CDN lib): cache-first with background refresh
  e.respondWith(
    caches.match(req).then(hit => {
      const refresh = fetch(req)
        .then(res => { if (res && res.ok) caches.open(V).then(c => c.put(req, res.clone())); return res; })
        .catch(() => hit);
      return hit || refresh;
    })
  );
});
