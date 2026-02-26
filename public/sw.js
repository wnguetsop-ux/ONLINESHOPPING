const CACHE_NAME = 'mastershop-v3';
const STATIC_CACHE = 'mastershop-static-v3';
const DYNAMIC_CACHE = 'mastershop-dynamic-v3';

// Only cache these specific static assets
const STATIC_ASSETS = [
  '/manifest.json',
  '/offline.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((n) => n !== STATIC_CACHE && n !== DYNAMIC_CACHE)
          .map((n) => caches.delete(n))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // --- NEVER intercept these - let browser handle directly ---
  // 1. Non-GET requests
  if (request.method !== 'GET') return;

  // 2. Next.js internals (_next/static, _next/image, etc.)
  if (url.pathname.startsWith('/_next/')) return;

  // 3. API routes
  if (url.pathname.startsWith('/api/')) return;

  // 4. Admin / superadmin pages - never cache
  if (url.pathname.startsWith('/superadmin') ||
      url.pathname.startsWith('/admin') ||
      url.pathname.startsWith('/dashboard') ||
      url.pathname.startsWith('/login') ||
      url.pathname.startsWith('/register')) {
    return;
  }

  // 5. External services
  if (url.hostname !== self.location.hostname) return;

  // 6. Firebase / Google APIs
  if (url.hostname.includes('firebase') ||
      url.hostname.includes('googleapis') ||
      url.hostname.includes('firestore') ||
      url.hostname.includes('gstatic')) {
    return;
  }

  // For public pages (shop storefronts, landing): cache-first strategy
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type === 'opaque') {
            return response;
          }
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => {
          if (request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/offline.html');
          }
        });
    })
  );
});

// Push notifications
self.addEventListener('push', (event) => {
  let data = { title: 'Mastershop', body: 'Nouvelle notification' };
  if (event.data) {
    try { data = event.data.json(); } catch (e) { data.body = event.data.text(); }
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      data: { url: data.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.openWindow(url));
});