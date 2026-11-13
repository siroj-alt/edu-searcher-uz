/* EduSearcher service worker: ilova tez ochilishi va internet bo'lmaganda ham ishlashi uchun.
   Sahifalar har doim avval internetdan olinadi (eski ma'lumot ko'rsatilmasin),
   internet bo'lmasa oxirgi saqlangan nusxa yoki "Internet yo'q" sahifasi ochiladi. */
const VERSION = 'v1';
const STATIC = 'es-static-' + VERSION;
const PAGES = 'es-pages-' + VERSION;
const OFFLINE = '/offline';
const PRECACHE = [OFFLINE, '/icons/icon-192.png', '/icons/icon-512.png'];
const MAX_PAGES = 40;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(STATIC).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keep = [STATIC, PAGES];
    for (const k of await caches.keys()) if (!keep.includes(k)) await caches.delete(k);
    if (self.registration.navigationPreload) { try { await self.registration.navigationPreload.enable(); } catch (_) {} }
    await self.clients.claim();
  })());
});

async function trim(name, max) {
  const c = await caches.open(name);
  const keys = await c.keys();
  for (let i = 0; i < keys.length - max; i++) await c.delete(keys[i]);
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Supabase, Yandex va boshqalar to'g'ridan-to'g'ri
  if (url.pathname.startsWith('/boshqaruv') || url.pathname.startsWith('/api/')) return;

  // Next.js fayllari va belgilar: o'zgarmaydi, xotiradan tez beriladi
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/') || /\.(?:woff2?|png|svg|ico)$/.test(url.pathname)) {
    e.respondWith(caches.open(STATIC).then(async (c) => {
      const hit = await c.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) c.put(req, res.clone());
      return res;
    }));
    return;
  }

  // Sahifalar: avval internet, bo'lmasa saqlangan nusxa
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const res = (await e.preloadResponse) || (await fetch(req));
        if (res.ok && res.type === 'basic') {
          const c = await caches.open(PAGES);
          c.put(req, res.clone()).then(() => trim(PAGES, MAX_PAGES));
        }
        return res;
      } catch (_) {
        const c = await caches.open(PAGES);
        return (await c.match(req, { ignoreSearch: true })) || (await caches.match(OFFLINE)) || new Response("Internet yo'q", { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
      }
    })());
  }
});
