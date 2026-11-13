import Link from 'next/link';
import MapView from '../../components/MapView';
import { supabase } from '../../lib/supabase';
import { CAT_COLORS, colorFor } from '../../lib/cats';
import { REGIONS, regionBySlug } from '../../lib/regions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Xarita | EduSearcher', description: "O'zbekiston bo'ylab o'quv markazlari va filiallari xaritada." };

export default async function Xarita({ searchParams }) {
  // Bitta so'rovda barcha filiallar (markaz nomi, manzil, yo'nalishlar bilan)
  const [ptsRes, catRes] = await Promise.all([supabase.rpc('map_points'), supabase.from('categories').select('id,name,slug').order('id')]);
  const all = ptsRes.data || [];
  const cats = catRes.data || [];
  const slug = typeof searchParams.cat === 'string' ? searchParams.cat : '';
  const region = regionBySlug(searchParams.region || '');
  const points = [];
  for (const b of all) {
    if (region && b.r !== region.id) continue;
    if (slug && !(b.s || []).includes(slug)) continue;
    points.push({ id: points.length + ':' + b.c + ':' + b.lat + ',' + b.lng, centerId: b.c, name: b.n, address: b.a, lat: b.lat, lng: b.lng, color: colorFor(slug || (b.s || [])[0]), rating: b.rt });
  }
  const nCenters = new Set(points.map((p) => p.centerId)).size;
  const used = new Set(all.flatMap((b) => b.s || []));
  const href = (cat, reg) => {
    const q = new URLSearchParams();
    if (cat) q.set('cat', cat);
    if (reg) q.set('region', reg);
    const s = q.toString();
    return '/xarita' + (s ? '?' + s : '');
  };
  return (
    <section className="xmap">
      <MapView full points={points} center={region ? [region.lat, region.lng] : null} zoom={11} />
      <div className="xbar">
        <Link href={href('', region?.slug)} className={!slug ? 'on' : ''} scroll={false}>Barchasi</Link>
        {cats.filter((c) => used.has(c.slug)).map((c) => <Link key={c.id} href={href(c.slug, region?.slug)} className={slug === c.slug ? 'on' : ''} scroll={false}><i style={{ background: CAT_COLORS[c.slug] }} />{c.name}</Link>)}
      </div>
      <div className="xbar r2">
        <Link href={href(slug, '')} className={!region ? 'on' : ''} scroll={false}>Butun O'zbekiston</Link>
        {REGIONS.map((r) => <Link key={r.slug} href={href(slug, r.slug)} className={region?.slug === r.slug ? 'on' : ''} scroll={false}>{r.short}</Link>)}
      </div>
      <div className="xcount">{region ? region.short + ': ' : ''}{nCenters} ta markaz · {points.length} ta filial</div>
    </section>
  );
}
