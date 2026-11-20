import { NextResponse } from 'next/server';

// Ruscha manzillar: /ru/... sahifasi o'sha o'zbekcha sahifani ko'rsatadi (matn brauzerda ruschaga o'giriladi),
// lekin qidiruv tizimlari uchun alohida manzil: o'z canonical havolasi, lang="ru" va hreflang juftligi bilan.
const SITE = 'https://edusearcher.uz';
const PRIVATE = /^\/(boshqaruv-|kabinet|markaz-kabineti|kirish|auth|offline|saqlangan)/;

const isRu = (p) => p === '/ru' || p.startsWith('/ru/');
const strip = (p) => (p === '/ru' ? '/' : p.slice(3));
const ruOf = (p) => (p === '/' ? '/ru' : '/ru' + p);
const linkHeader = (uz) => [
  `<${SITE}${uz}>; rel="alternate"; hreflang="uz"`,
  `<${SITE}${ruOf(uz)}>; rel="alternate"; hreflang="ru"`,
  `<${SITE}${uz}>; rel="alternate"; hreflang="x-default"`
].join(', ');

function isDocument(req) {
  if (req.method !== 'GET') return false;
  const h = req.headers;
  if (h.get('rsc') || h.get('next-router-prefetch') || h.get('next-router-state-tree') || req.nextUrl.searchParams.has('_rsc')) return false;
  return (h.get('accept') || '').includes('text/html');
}

export async function middleware(req) {
  const path = req.nextUrl.pathname;

  if (!isRu(path)) {
    // O'zbekcha sahifalar: ruscha muqobili haqida HTTP sarlavhasi
    if (isDocument(req) && !PRIVATE.test(path)) {
      const res = NextResponse.next();
      res.headers.set('Link', linkHeader(path));
      return res;
    }
    return NextResponse.next();
  }

  const uz = strip(path);
  const target = new URL(uz + req.nextUrl.search, req.url);
  if (PRIVATE.test(uz) || !isDocument(req)) return NextResponse.rewrite(target);

  try {
    const headers = new Headers(req.headers);
    headers.set('x-es-lang', 'ru');
    headers.delete('accept-encoding');
    const r = await fetch(target, { headers, redirect: 'manual' });
    const type = r.headers.get('content-type') || '';
    if (r.status !== 200 || !type.includes('text/html')) return NextResponse.rewrite(target);
    let html = await r.text();
    const ruUrl = SITE + ruOf(uz);
    html = html
      .replace(/<html lang="uz"/, '<html lang="ru"')
      .replace(/<link rel="canonical" href="[^"]*"/, `<link rel="canonical" href="${ruUrl}"`)
      .replace(/<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${ruUrl}"`)
      .replace(/<meta property="og:locale" content="uz_UZ"/, '<meta property="og:locale" content="ru_RU"');
    const out = new Headers();
    r.headers.forEach((v, k) => { if (!/^(content-length|content-encoding|transfer-encoding|connection|set-cookie)$/i.test(k)) out.set(k, v); });
    out.set('content-type', 'text/html; charset=utf-8');
    out.set('content-language', 'ru');
    out.set('Link', linkHeader(uz));
    return new Response(html, { status: 200, headers: out });
  } catch {
    return NextResponse.rewrite(target);
  }
}

export const config = {
  matcher: ['/((?!_next/|api/|favicon|icon|apple-icon|opengraph-image|manifest|robots|sitemap|sw\\.js|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|js|css|txt|xml|webmanifest|json|woff2?)$).*)']
};
