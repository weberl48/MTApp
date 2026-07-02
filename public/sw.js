// Bumped from mca-v1 -> mca-v2 so the `activate` handler evicts any previously cached HTML pages
// (the old service worker cached server-rendered dashboard/portal pages that contain decrypted PHI).
const CACHE_NAME = 'mca-v2'

// Only non-PHI, non-authenticated assets are pre-cached. Do NOT pre-cache dashboard/portal pages —
// they are server-rendered with PHI.
const STATIC_ASSETS = [
  '/offline.html'
]

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// Activate: clean old caches (this purges the pre-existing mca-v1 cache and any PHI it held)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    })
  )
  self.clients.claim()
})

// Fetch handler
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip non-http(s) schemes (chrome-extension, etc.)
  if (!url.protocol.startsWith('http')) return

  // Skip external URLs (only cache same-origin)
  if (url.origin !== self.location.origin) return

  // Skip API requests and auth endpoints (always need fresh data)
  if (request.url.includes('/api/') || request.url.includes('/auth/')) {
    return
  }

  // NEVER cache HTML navigations. Dashboard and portal pages are server-rendered with decrypted
  // PHI (client notes, session notes) inlined into the HTML. A single shared Cache Storage bucket
  // is not partitioned per user and is not cleared on logout, so caching these pages would expose
  // one user's PHI to the next person on a shared device (and offline could serve a stale, wrong
  // user's page). Network-only, with the static offline page as the only fallback.
  const isHTMLNavigation =
    request.mode === 'navigate' ||
    (request.headers.get('accept') || '').includes('text/html')

  if (isHTMLNavigation) {
    event.respondWith(
      fetch(request).catch(() => caches.match('/offline.html'))
    )
    return
  }

  // Static assets only (JS/CSS/images/fonts) — safe to cache. Network-first with cache fallback.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone)
          })
        }
        return response
      })
      .catch(() => {
        return caches.match(request).then((cached) => {
          if (cached) return cached
          return new Response('Offline', { status: 503 })
        })
      })
  )
})
