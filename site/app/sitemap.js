import { loadCenters, regionIdsOf, slugsOf } from '../lib/points';
import { REGIONS } from '../lib/regions';
import { SITE, CAT_URL } from '../lib/seo';
import { supabase } from '../lib/supabase';

export const revalidate = 3600;

// Tuman × yo'nalish sahifasi xaritaga kiritilishi uchun kamida shuncha markaz bo'lishi kerak
const MIN_DISTRICT = 3;

export default async function sitemap() {
  const now = new Date();
  const [centers, dRes] = await Promise.all([
    loadCenters(),
    supabase.from('districts').select('id,slug,region_id')
  ]);
  const districts = Object.fromEntries((dRes.data || []).filter((d) => d.slug).map((d) => [d.id, d]));
  const page = (path, freq, priority, ru = false) => {
    const out = [{ url: `${SITE}${path}`, lastModified: now, changeFrequency: freq, priority }];
    if (ru) out.push({ url: `${SITE}/ru${path === '/' ? '' : path}`, lastModified: now, changeFrequency: freq, priority: Math.max(0.1, priority - 0.2) });
    return out;
  };
  const pages = [
    ...page('/', 'daily', 1, true),
    ...page('/search', 'daily', 0.8),
    ...page('/xarita', 'daily', 0.7),
    ...page('/markazlar', 'weekly', 0.8, true),
    ...page('/narxlar', 'weekly', 0.7, true),
    ...page('/hamkorlik', 'monthly', 0.5),
    ...page('/maxfiylik', 'yearly', 0.2),
    ...page('/foydalanish-shartlari', 'yearly', 0.2)
  ];
  const regCat = new Set();
  const regAny = new Set();
  const distCat = new Map();
  for (const c of centers) {
    const slugs = slugsOf(c);
    for (const r of regionIdsOf(c)) { regAny.add(r); for (const s of slugs) regCat.add(r + ':' + s); }
    const ds = new Set(c.branches.map((b) => b.district_id).filter(Boolean));
    for (const d of ds) for (const s of slugs) distCat.set(d + ':' + s, (distCat.get(d + ':' + s) || 0) + 1);
  }
  for (const r of REGIONS) {
    if (!regAny.has(r.id)) continue;
    pages.push(...page(`/markazlar/${r.slug}`, 'weekly', 0.8, true));
    for (const [slug, u] of Object.entries(CAT_URL)) {
      if (regCat.has(r.id + ':' + slug)) pages.push(...page(`/markazlar/${r.slug}/${u}`, 'weekly', 0.7));
    }
  }
  for (const [key, n] of distCat) {
    if (n < MIN_DISTRICT) continue;
    const [dId, slug] = key.split(':');
    const d = districts[dId];
    const r = d && REGIONS.find((x) => x.id === d.region_id);
    const u = CAT_URL[slug];
    if (r && u) pages.push(...page(`/markazlar/${r.slug}/${u}/${d.slug}`, 'weekly', 0.6));
  }
  for (const c of centers) {
    pages.push({ url: `${SITE}/centers/${c.id}`, lastModified: new Date(c.updated_at || c.created_at || now), changeFrequency: 'weekly', priority: 0.6 });
  }
  return pages;
}
