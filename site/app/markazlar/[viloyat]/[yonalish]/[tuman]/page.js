import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabase } from '../../../../../lib/supabase';
import { loadCenters, inDistrict, slugsOf, byFeatured, toPoints } from '../../../../../lib/points';
import { regionBySlug } from '../../../../../lib/regions';
import { CAT_FROM_URL, catPhrase, jsonLd, SITE, OG_IMAGES } from '../../../../../lib/seo';
import CenterTile from '../../../../../components/CenterTile';
import MapView from '../../../../../components/MapView';

export const dynamic = 'force-dynamic';

const sum = (n) => (n >= 1e6 ? (n / 1e6).toLocaleString('ru-RU', { maximumFractionDigits: 1 }) + ' mln' : Math.round(n / 1000) + ' ming');

async function resolve(params) {
  const region = regionBySlug(params.viloyat);
  const slug = CAT_FROM_URL[params.yonalish];
  if (!region || !slug) return null;
  const [catRes, dRes] = await Promise.all([
    supabase.from('categories').select('id,name,slug').eq('slug', slug).maybeSingle(),
    supabase.from('districts').select('id,name,slug,region_id').eq('region_id', region.id).order('sort')
  ]);
  const cat = catRes.data;
  const districts = dRes.data || [];
  const district = districts.find((d) => d.slug === params.tuman);
  if (!cat || !district) return null;
  const all = await loadCenters();
  const centers = inDistrict(all, district.id).filter((c) => slugsOf(c).includes(slug)).sort(byFeatured);
  // Shu viloyatdagi boshqa tumanlar (shu yo'nalish bo'yicha markaz bor bo'lganlari)
  const others = districts.map((d) => ({ ...d, n: inDistrict(all, d.id).filter((c) => slugsOf(c).includes(slug)).length }))
    .filter((d) => d.id !== district.id && d.n > 0);
  return { region, cat, district, centers, others };
}

const placeOf = (d) => d.name + 'dagi';

export async function generateMetadata({ params }) {
  const r = await resolve(params);
  if (!r || !r.centers.length) return { title: 'Sahifa topilmadi | EduSearcher', robots: { index: false } };
  const path = `/markazlar/${r.region.slug}/${params.yonalish}/${r.district.slug}`;
  const phrase = catPhrase(r.cat);
  const title = `${placeOf(r.district)} ${phrase} kurslari — ${r.centers.length} ta markaz | EduSearcher`;
  const description = `${r.region.name}, ${r.district.name}: ${phrase} kurslari bo'yicha ${r.centers.length} ta o'quv markazi. Narxlar, manzillar, xarita va sharhlar. Uyingizga eng yaqinini tanlang.`;
  return {
    title, description,
    alternates: { canonical: path },
    robots: r.centers.length < 3 ? { index: false, follow: true } : undefined,
    openGraph: { type: 'website', url: path, title, description, siteName: 'EduSearcher', locale: 'uz_UZ', images: OG_IMAGES }
  };
}

export default async function DistrictPage({ params }) {
  const r = await resolve(params);
  if (!r || !r.centers.length) notFound();
  const { region, cat, district, centers, others } = r;
  const phrase = catPhrase(cat);
  const { data: idx } = await supabase.rpc('price_index');
  const pi = (idx || []).find((x) => x.level === 'district' && x.district_id === district.id && x.category_id === cat.id && x.centers >= 3);
  const inD = new Set(centers.flatMap((c) => c.branches.filter((b) => b.district_id === district.id).map((b) => b.id)));
  const points = toPoints(centers, cat.slug).filter((p) => inD.has(p.id));
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${placeOf(district)} ${phrase} kurslari`,
    numberOfItems: centers.length,
    itemListElement: centers.slice(0, 30).map((c, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}/centers/${c.id}`, name: c.name }))
  };

  return (
    <div className="wrap page lp">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} />
      <nav className="crumbs" aria-label="Sahifa yo'li">
        <Link href="/">Bosh sahifa</Link><span aria-hidden="true">/</span>
        <Link href="/markazlar">Viloyatlar</Link><span aria-hidden="true">/</span>
        <Link href={`/markazlar/${region.slug}`}>{region.name}</Link><span aria-hidden="true">/</span>
        <Link href={`/markazlar/${region.slug}/${params.yonalish}`}>{cat.name}</Link><span aria-hidden="true">/</span>
        <span>{district.name}</span>
      </nav>
      <h1 className="h1s">{`${placeOf(district)} ${phrase} kurslari`}</h1>
      <p className="lp-intro">
        {`${region.name}, ${district.name}: ${phrase} bo'yicha ${centers.length} ta o'quv markazi. `}
        {pi ? `Oylik narx odatda ${sum(pi.p_min)} so'mdan ${sum(pi.p_max)} so'mgacha, o'rtacha ${sum(pi.p_med)} so'm. ` : ''}
        Xaritada uyingizga yaqinini tanlang va sayt orqali o'qishga ariza bering.
      </p>
      <div className="row" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '6px 0 16px' }}>
        <Link className="btn sm" href={`/search?region=${region.slug}&tuman=${district.id}&cat=${cat.id}`}>Filtr bilan qidirish</Link>
        <Link className="btn ghost sm" href="/narxlar">Kurs narxlari indeksi</Link>
      </div>
      {points.length ? <div className="lp-map" style={{ height: 320, borderRadius: 20, overflow: 'hidden', marginBottom: 18 }}><MapView points={points} zoom={13} /></div> : null}
      <div className="tiles">{centers.slice(0, 60).map((c, i) => <CenterTile key={c.id} c={c} i={i} slug={cat.slug} />)}</div>
      {centers.length > 60 ? <p className="muted" style={{ marginTop: 12 }}>Yana {centers.length - 60} ta markaz — <Link href={`/search?region=${region.slug}&tuman=${district.id}&cat=${cat.id}`}>qidiruvda ko'ring</Link>.</p> : null}
      {others.length ? (
        <>
          <div className="sec"><h2>{`${region.name}ning boshqa tumanlari`}</h2><i /></div>
          <div className="chips">
            {others.map((d) => <Link key={d.id} href={`/markazlar/${region.slug}/${params.yonalish}/${d.slug}`}>{`${d.name} (${d.n})`}</Link>)}
          </div>
        </>
      ) : null}
    </div>
  );
}

