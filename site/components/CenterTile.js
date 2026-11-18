import { slugsOf, regionIdsOf, priceRange } from '../lib/points';
import { colorFor, initials, CAT_GLYPH } from '../lib/cats';
import { regionById } from '../lib/regions';
import Tile from './Tile';

const sum = (n) => (n >= 1e6 ? (n / 1e6).toLocaleString('ru-RU', { maximumFractionDigits: 1 }) + ' mln' : Math.round(n / 1000) + ' ming');
const fmtKm = (k) => (k < 1 ? Math.round(k * 1000) + ' m' : k.toFixed(1).replace('.', ',') + ' km');

// Markazni ixcham kartaga aylantiradi
export function centerToTile(c, { slug = null, reviews = 0, km = null, districts = null } = {}) {
  const slugs = slugsOf(c);
  const main = slug || slugs[0];
  const regions = regionIdsOf(c).map((id) => regionById(id)?.short).filter(Boolean);
  const dName = districts && c.branches[0]?.district_id ? districts[c.branches[0].district_id] : null;
  const base = regions.length > 2 ? `${regions.length} ta viloyatda` : [dName || regions[0]].filter(Boolean).join(', ') || "O'zbekiston";
  const pr = priceRange(c, slug);
  const names = [...new Set(c.courses.map((k) => k.categories?.name).filter(Boolean))];
  return {
    id: c.id, name: c.name, cover: c.cover_url || null, color: colorFor(main), glyph: CAT_GLYPH[main] || 'Edu', initials: initials(c.name),
    badge: c.is_featured ? 'feat' : null, verified: !!c.is_verified,
    sub: names.slice(0, 2).join(', ') + (names.length > 2 ? ` +${names.length - 2}` : ''),
    price: pr ? (pr[0] === pr[1] ? `${sum(pr[0])} so'm` : `${sum(pr[0])} so'mdan`) : 'Narx kelishiladi',
    place: c.branches.length > 1 && regions.length <= 2 ? `${base} · ${c.branches.length} filial` : base,
    km: km != null && Number.isFinite(km) ? fmtKm(km) : null,
    rating: Number(c.rating) || 0, reviews, phone: c.phone || null, telegram: c.telegram || null
  };
}

export default function CenterTile({ c, i = 0, slug = null, reviews = 0, km = null, districts = null }) {
  return <Tile t={centerToTile(c, { slug, reviews, km, districts })} i={i} />;
}
