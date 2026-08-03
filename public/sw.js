const SHELL_CACHE = 'compass-shell-v2'
const ASSET_CACHE = 'compass-assets-v2'

// Cache the app shell on install so navigation works offline immediately
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(cache => cache.addAll(['/index.html', '/manifest.json', '/favicon.svg']))
      .then(() => self.skipWaiting())
  )
})

// Remove outdated caches on activate
self.addEventListener('activate', event => {
  const keep = [SHELL_CACHE, ASSET_CACHE]
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => !keep.includes(k)).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle same-origin GET requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  // SPA navigation: network first, fall back to cached shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          caches.open(SHELL_CACHE).then(c => c.put('/index.html', response.clone()))
          return response
        })
        .catch(() => caches.match('/index.html'))
    )
    return
  }

  // Vite hashed assets (/assets/*) are immutable — cache permanently
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.open(ASSET_CACHE).then(async cache => {
        const cached = await cache.match(request)
        if (cached) return cached
        const response = await fetch(request)
        if (response.ok) cache.put(request, response.clone())
        return response
      })
    )
    return
  }

  // Static files (favicon, manifest, icons): serve cached, revalidate in background
  event.respondWith(
    caches.match(request).then(cached => {
      const fresh = fetch(request).then(response => {
        if (response.ok) {
          caches.open(SHELL_CACHE).then(c => c.put(request, response.clone()))
        }
        return response
      })
      return cached || fresh
    })
  )
})
