import { supabase } from './supabase';
import { colorFor } from './cats';

const FIELDS = 'id,name,rating,phone,telegram,website,is_verified,is_featured,created_at,updated_at,cover_url,logo_url,branches(id,address,lat,lng,region_id,district_id),courses(level,price_monthly,categories(slug,name))';
const PAGE = 1000; // Supabase bir so'rovda ko'pi bilan 1000 qator qaytaradi

export async function loadCenters() {
  // Sahifalar parallel yuklanadi: avval soni, keyin barcha bo'laklar bir vaqtda
  const { count } = await supabase.from('centers').select('id', { count: 'exact', head: true });
  const n = Math.min(Math.max(count || PAGE, 1), 20000);
  const parts = [];
  for (let from = 0; from < n; from += PAGE) parts.push(supabase.from('centers').select(FIELDS).order('id').range(from, from + PAGE - 1));
  const res = await Promise.all(parts);
  const all = [];
  for (const { data, error } of res) if (!error && data) all.push(...data);
  return all.map((c) => ({ ...c, branches: c.branches || [], courses: c.courses || [] }));
}

export const slugsOf = (c) => [...new Set(c.courses.map((k) => k.categories?.slug).filter(Boolean))];
export const catNamesOf = (c) => [...new Set(c.courses.map((k) => k.categories?.name).filter(Boolean))];
export const regionIdsOf = (c) => [...new Set(c.branches.map((b) => b.region_id).filter(Boolean))];

// Viloyat bo'yicha filtr: markazning shu viloyatdagi filiallarigina qoladi
export function inRegion(centers, regionId) {
  if (!regionId) return centers;
  return centers
    .map((c) => ({ ...c, branches: c.branches.filter((b) => b.region_id === regionId) }))
    .filter((c) => c.branches.length > 0);
}

// Tuman bo'yicha filtr
export function inDistrict(centers, districtId) {
  if (!districtId) return centers;
  return centers
    .map((c) => ({ ...c, branches: c.branches.filter((b) => b.district_id === districtId) }))
    .filter((c) => c.branches.length > 0);
}

// Bo'lim bo'yicha filtr: markazda bo'limdagi yo'nalishlardan kamida bittasi bo'lsa
export function inSection(centers, slugs) {
  if (!slugs || !slugs.length) return centers;
  const set = new Set(slugs);
  return centers.filter((c) => c.courses.some((k) => set.has(k.categories?.slug)));
}

// Narx oralig'i: markazda shu oraliqdagi narxli kurs bo'lsa
export function inPrice(centers, min, max) {
  if (!min && !max) return centers;
  return centers.filter((c) => c.courses.some((k) => {
    const p = Number(k.price_monthly);
    return p > 0 && (!min || p >= min) && (!max || p <= max);
  }));
}

export function toPoints(centers, slug) {
  const pts = [];
  for (const c of centers) {
    const s = slugsOf(c);
    if (slug && !s.includes(slug)) continue;
    for (const b of c.branches) {
      if (b.lat == null || b.lng == null) continue;
      pts.push({ id: b.id, centerId: c.id, name: c.name, address: b.address, lat: b.lat, lng: b.lng, color: colorFor(slug || s[0]), rating: c.rating });
    }
  }
  return pts;
}

// Oylik narxlar oralig'i (narx kiritilgan kurslar bo'yicha)
export function priceRange(c, slug) {
  const p = c.courses.filter((k) => !slug || k.categories?.slug === slug).map((k) => Number(k.price_monthly)).filter((x) => x > 0);
  return p.length ? [Math.min(...p), Math.max(...p)] : null;
}

// Ikki nuqta orasidagi masofa (km)
export function kmBetween(a, b) {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Markazning eng yaqin filialigacha masofa
export function nearestKm(c, pos) {
  let best = Infinity;
  for (const b of c.branches) if (b.lat != null && b.lng != null) best = Math.min(best, kmBetween(pos, b));
  return best;
}

// Tavsiya etilganlar birinchi, keyin reyting va filiallar soni
export const byFeatured = (a, b) => (b.is_featured === true) - (a.is_featured === true)
  || (Number(b.rating) || 0) - (Number(a.rating) || 0) || b.branches.length - a.branches.length || a.name.localeCompare(b.name);
