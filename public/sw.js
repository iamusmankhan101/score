/**
 * public/sw.js — Salon Central service worker
 *
 * Jobs:
 *   1. receive Web Push payloads and show a notification
 *   2. focus (or open) the right page when a notification is tapped
 *   3. keep the app shell available offline, so a salon that loses its
 *      connection can still ring up a sale
 *
 * ── What may and may not be cached ──────────────────────────────────────────
 *
 * This app serves per-tenant data behind a session cookie, so caching the
 * wrong thing would show one salon's data to another user on a shared
 * reception PC. The rule that keeps that safe: cache the *shell*, never the
 * *data*.
 *
 *   • /api/** is never cached, under any strategy. Every byte of tenant data
 *     arrives through it, and it is the one thing a stale or cross-account
 *     response would leak.
 *   • /_next/static/** is content-hashed, identical for every tenant, and
 *     immutable — cache-first, and a changed file gets a new URL anyway.
 *   • Navigations are network-first, falling back to cache only when the
 *     network fails. Every component under app/(dashboard) is "use client",
 *     so the server-rendered HTML is an empty shell: the tenant's data is
 *     read from localStorage after hydration and never appears in the
 *     document. That is what makes caching it safe, and it stops being true
 *     the moment a server component under /dashboard renders salon data —
 *     so if one is ever added, exclude its route here.
 *   • Sign-in and sign-up are never cached: they are the pages whose response
 *     depends most directly on session state.
 *
 * As further insurance the page posts CLEAR_CACHES on sign-out, which drops
 * the shell and asset caches so nothing survives a handover between staff.
 *
 * Route JS chunks are cached as they are fetched, so a page works offline
 * once it has been opened online at least once. A screen never visited on a
 * given device won't render offline — there is nothing to fall back to.
 *
 * Bump SW_VERSION whenever this file changes so clients drop the old caches.
 */

const SW_VERSION    = "v3";
const OFFLINE_CACHE = `salon-central-offline-${SW_VERSION}`;
const SHELL_CACHE   = `salon-central-shell-${SW_VERSION}`;
const ASSET_CACHE   = `salon-central-assets-${SW_VERSION}`;
const OFFLINE_URL   = "/offline.html";

const CURRENT_CACHES = [OFFLINE_CACHE, SHELL_CACHE, ASSET_CACHE];

/** Navigations worth keeping a shell for. Anything else falls back to /offline.html. */
function isCacheableNavigation(url) {
  return url.pathname === "/dashboard"
    || url.pathname.startsWith("/dashboard/")
    || url.pathname.startsWith("/client/");
}

/** Immutable, tenant-agnostic build output. */
function isStaticAsset(url) {
  return url.pathname.startsWith("/_next/static/")
    || url.pathname.startsWith("/icons/")
    || url.pathname === "/offline.html";
}

// ─── Install: pre-cache the offline fallback ─────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(OFFLINE_CACHE)
      .then((cache) => cache.addAll([OFFLINE_URL, "/icons/icon-192.png"]))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  );
});

// ─── Activate: drop caches from previous versions ────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !CURRENT_CACHES.includes(k)).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

// ─── Fetch ───────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Tenant data. Never cached, never served from cache — let it fail honestly
  // when offline so the app's own queueing and merge logic can react.
  if (url.pathname.startsWith("/api/")) return;

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, ASSET_CACHE));
    return;
  }

  // Covers both full page loads and the RSC payloads App Router fetches when
  // moving between dashboard screens — without the latter, client-side
  // navigation dead-ends offline even with the shell cached.
  const isNavigation = request.mode === "navigate";
  const isRscPayload = url.searchParams.has("_rsc");
  if (isNavigation || isRscPayload) {
    event.respondWith(networkFirst(request, url, isNavigation));
  }
});

/**
 * Serve from cache, falling back to network and storing what comes back.
 * Safe here because every URL handled this way is content-hashed or static.
 */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // A missing chunk can't be faked into existence; let the page handle it.
    throw err;
  }
}

/**
 * Always prefer the network so staff see live data, and keep the last good
 * copy of the shell purely as an offline fallback.
 */
async function networkFirst(request, url, isNavigation) {
  try {
    const response = await fetch(request);
    // Only real 200s get stored. A navigation carries redirect: "manual", so
    // middleware bouncing a signed-out /dashboard hit to /sign-in arrives here
    // as an opaqueredirect — status 0, ok false — and is refused by this
    // check. Without it the login page would be cached under the /dashboard
    // key and shown to a signed-in user every time they opened the app
    // offline. (A cached redirected response also can't legally be replayed
    // for a navigation, so storing one would break the fallback outright.)
    if (response.ok && response.status === 200 && isCacheableNavigation(url)) {
      const cache = await caches.open(SHELL_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    // A dashboard sub-page that was never opened online has no shell of its
    // own — fall back to the dashboard root, which the app can route from.
    if (isNavigation && url.pathname.startsWith("/dashboard")) {
      const root = await caches.match("/dashboard");
      if (root) return root;
    }

    if (isNavigation) {
      const offline = await caches.match(OFFLINE_URL);
      if (offline) return offline;
    }

    return new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } });
  }
}

// ─── Push ────────────────────────────────────────────────────────────────────
// Payload shape sent by lib/push.ts:
//   { title, body, url, tag, icon, badge, image, requireInteraction, actions }
// A push with no payload (or unparseable JSON) still shows a generic
// notification: on Chrome/Android a "userVisibleOnly" subscription that
// receives a push without showing one gets a browser-generated
// "This site has been updated in the background" notice instead.
self.addEventListener("push", (event) => {
  let payload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      payload = { body: event.data.text() };
    }
  }

  const title = payload.title || "Salon Central";
  const options = {
    body:    payload.body  || "You have a new update from your salon.",
    icon:    payload.icon  || "/icons/icon-192.png",
    badge:   payload.badge || "/icons/icon-192.png",
    image:   payload.image || undefined,
    tag:     payload.tag   || "salon-central",
    renotify: Boolean(payload.tag),
    requireInteraction: Boolean(payload.requireInteraction),
    actions: Array.isArray(payload.actions) ? payload.actions.slice(0, 2) : [],
    // Read back in notificationclick to decide where to navigate.
    data: {
      url: payload.url || "/",
      sentAt: payload.sentAt || Date.now(),
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ─── Notification click ──────────────────────────────────────────────────────
// Focus an already-open tab on the target origin and navigate it, rather than
// piling up duplicate tabs each time a client taps an offer.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  // An action button may carry its own url (payload.actions[].url is not part
  // of the Notification API, so we look it up from the stored data instead).
  const target = event.notification.data?.url || "/";
  const targetUrl = new URL(target, self.location.origin);

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (new URL(client.url).origin !== targetUrl.origin) continue;
          if ("focus" in client) {
            if (client.url !== targetUrl.href && "navigate" in client) {
              return client.navigate(targetUrl.href).then((c) => c && c.focus());
            }
            return client.focus();
          }
        }
        return self.clients.openWindow(targetUrl.href);
      }),
  );
});

// ─── Subscription rotation ───────────────────────────────────────────────────
// Browsers may silently rotate an endpoint. Re-subscribe and hand the new
// subscription to the backend so the old row can be swapped out.
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    (async () => {
      const applicationServerKey = event.oldSubscription?.options?.applicationServerKey;
      if (!applicationServerKey) return;

      const fresh = await self.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: fresh.toJSON(),
          previousEndpoint: event.oldSubscription?.endpoint,
        }),
      }).catch(() => {});
    })(),
  );
});

// ─── Messages from the page ──────────────────────────────────────────────────
self.addEventListener("message", (event) => {
  // Lets the page tell a waiting worker to take over immediately after a deploy.
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();

  // Posted on sign-out. The shell holds no tenant data by design, but a
  // shared reception PC changing hands is exactly when "by design" is worth
  // backing up with an actual delete.
  if (event.data?.type === "CLEAR_CACHES") {
    event.waitUntil(
      caches.keys().then((keys) =>
        Promise.all(keys.filter((k) => k === SHELL_CACHE || k === ASSET_CACHE).map((k) => caches.delete(k))),
      ),
    );
  }
});
