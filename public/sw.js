const CACHE_PREFIX = 'atlas-crm'
const CACHE_VERSION = 'v1'
const STATIC_CACHE = `${CACHE_PREFIX}-static-${CACHE_VERSION}`
const RUNTIME_CACHE = `${CACHE_PREFIX}-runtime-${CACHE_VERSION}`
const STATIC_ASSETS = [
  '/manifest.webmanifest',
  '/favicon.ico',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/apple-touch-icon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/atlas-beyond-destinations.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && ![STATIC_CACHE, RUNTIME_CACHE].includes(key))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

function isSameOrigin(request) {
  return new URL(request.url).origin === self.location.origin
}

async function saveResponse(request, response) {
  if (!response || response.status !== 200 || response.type === 'opaque') return response

  const cache = await caches.open(RUNTIME_CACHE)
  await cache.put(request, response.clone()).catch(() => undefined)
  return response
}

async function networkFirst(request) {
  try {
    const response = await fetch(request)
    return saveResponse(request, response)
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached

    if (request.mode === 'navigate') {
      const root = await caches.match('/')
      if (root) return root

      return new Response('Atlas CRM offline. Abra novamente uma página já visitada quando estiver sem internet.', {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    }

    return new Response('', { status: 504 })
  }
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request)
  const refresh = fetch(request)
    .then((response) => saveResponse(request, response))
    .catch(() => undefined)

  return cached || refresh || networkFirst(request)
}

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.method !== 'GET' || !isSameOrigin(request)) return

  const url = new URL(request.url)
  const isStaticAsset = ['style', 'script', 'font', 'image', 'manifest'].includes(request.destination) ||
    url.pathname.startsWith('/_next/static/')

  if (request.mode === 'navigate' || url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request))
    return
  }

  if (isStaticAsset) {
    event.respondWith(staleWhileRevalidate(request))
    return
  }

  event.respondWith(networkFirst(request))
})
