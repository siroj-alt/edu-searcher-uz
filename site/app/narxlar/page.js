import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { REGIONS, regionBySlug } from '../../lib/regions';
import { CAT_URL, jsonLd, SITE, OG_IMAGES } from '../../lib/seo';
import { colorFor, CAT_GLYPH } from '../../lib/cats';

export const dynamic = 'force-dynamic';

// Narx ko'rsatilishi uchun kamida shuncha markaz narxi bo'lishi kerak (bitta markaz narxi "indeks" emas)
const MIN_N = 3;

const sum = (n) => (n >= 1e6 ? (n / 1e6).toLocaleString('ru-RU', { maximumFractionDigits: 1 }) + ' mln' : Math.round(n / 1000) + ' ming');

export async function generateMetadata({ searchParams }) {
  const region = regionBySlug(searchParams?.viloyat || '');
  const where = region ? region.name + 'da' : "O'zbekistonda";
  const title = `${where} kurs narxlari indeksi — oylik to'lovlar | EduSearcher`;
  const description = `${where} o'quv markazlarida ingliz tili, IELTS, IT, matematika va boshqa kurslarning oylik narxlari: eng arzon, o'rtacha va eng qimmat narx. Har oy yangilanadi.`;
  const path = region ? `/narxlar?viloyat=${region.slug}` : '/narxlar';
  return { title, description, alternates: { canonical: path }, openGraph: { type: 'website', url: path, title, description, siteName: 'EduSearcher', locale: 'uz_UZ', images: OG_IMAGES } };
}

export default async function PriceIndex({ searchParams }) {
  const region = regionBySlug(searchParams?.viloyat || '');
  const [idxRes, catRes, dRes, upd] = await Promise.all([
    supabase.rpc('price_index'),
    supabase.from('categories').select('id,name,slug').order('name'),
    region ? supabase.from('districts').select('id,name,slug').eq('region_id', region.id).order('sort') : Promise.resolve({ data: [] }),
    supabase.from('courses').select('price_updated_at').gt('price_monthly', 0).order('price_updated_at', { ascending: false, nullsFirst: false }).limit(1)
  ]);
  const idx = idxRes.data || [];
  const cats = catRes.data || [];
  const catById = Object.fromEntries(cats.map((c) => [c.id, c]));
  const rows = idx.filter((x) => (region ? x.level === 'region' && x.region_id === region.id : x.level === 'country'));
  const ready = rows.filter((x) => x.centers >= MIN_N).sort((a, b) => b.centers - a.centers);
  const pending = rows.filter((x) => x.centers < MIN_N);
  const districts = dRes.data || [];
  const dRows = region ? idx.filter((x) => x.level === 'district' && x.region_id === region.id && x.centers >= MIN_N) : [];
  const lastUpd = upd.data?.[0]?.price_updated_at ? new Date(upd.data[0].price_updated_at) : null;
  const where = region ? region.name + 'da' : "O'zbekistonda";
  const totalPriced = rows.reduce((s, x) => s + x.centers, 0);

  const ld = ready.length ? {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: `${where} kurs narxlari indeksi`,
    description: `${where} o'quv markazlaridagi kurslarning oylik narxlari (eng arzon, mediana, eng qimmat).`,
    url: `${SITE}/narxlar${region ? '?viloyat=' + region.slug : ''}`,
    creator: { '@type': 'Organization', name: 'EduSearcher', url: SITE },
    dateModified: lastUpd ? lastUpd.toISOString() : undefined,
    spatialCoverage: region ? region.name : "O'zbekiston"
  } : null;

  return (
    <div className="wrap page pidx">
      {ld ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} /> : null}
      <nav className="crumbs" aria-label="Sahifa yo'li">
        <Link href="/">Bosh sahifa</Link><span aria-hidden="true">/</span>
        {region ? <><Link href="/narxlar">Narxlar indeksi</Link><span aria-hidden="true">/</span><span>{region.name}</span></> : <span>Narxlar indeksi</span>}
      </nav>
      <h1 className="h1s">{`${where} kurs narxlari`}</h1>
      <p className="lp-intro">
        O'quv markazlari bizga yuborgan oylik narxlar asosida: eng arzon, o'rtacha (mediana) va eng qimmat narx.
        {lastUpd ? ` Oxirgi yangilanish: ${lastUpd.toLocaleDateString('ru-RU')}.` : ''} Faqat so'nggi 6 oyda tasdiqlangan narxlar hisobga olinadi.
      </p>

      <div className="chips pidx-reg" role="navigation" aria-label="Viloyat">
        <Link href="/narxlar" className={region ? '' : 'on'}>Butun O'zbekiston</Link>
        {REGIONS.map((r) => <Link key={r.id} href={`/narxlar?viloyat=${r.slug}`} className={region?.id === r.id ? 'on' : ''}>{r.short || r.name}</Link>)}
      </div>

      {ready.length ? (
        <div className="pidx-table" role="table" aria-label="Kurs narxlari">
          <div className="pidx-row head" role="row">
            <span role="columnheader">Yo'nalish</span><span role="columnheader">Eng arzon</span><span role="columnheader">O'rtacha</span><span role="columnheader">Eng qimmat</span><span role="columnheader">Markazlar</span>
          </div>
          {ready.map((x) => {
            const c = catById[x.category_id];
            if (!c) return null;
            const u = CAT_URL[c.slug];
            return (
              <div className="pidx-row" role="row" key={x.category_id}>
                <span role="cell" className="pidx-cat">
                  <i style={{ background: colorFor(c.slug) }} aria-hidden="true">{CAT_GLYPH[c.slug] || c.name[0]}</i>
                  {region && u ? <Link href={`/markazlar/${region.slug}/${u}`}>{c.name}</Link> : <Link href={`/search?cat=${c.id}`}>{c.name}</Link>}
                </span>
                <span role="cell" data-l="Eng arzon">{sum(x.p_min)} so'm</span>
                <span role="cell" data-l="O'rtacha"><b>{sum(x.p_med)} so'm</b></span>
                <span role="cell" data-l="Eng qimmat">{sum(x.p_max)} so'm</span>
                <span role="cell" data-l="Markazlar">{x.centers}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card pidx-empty">
          <h2 className="h2">Narxlar hozir yig'ilmoqda</h2>
          <p>{`${where} hali biror yo'nalish bo'yicha kamida ${MIN_N} ta markaz narxini yubormagan. Ishonchli o'rtacha narx chiqishi uchun shuncha markaz kerak.`}</p>
          <p>{totalPriced ? `Hozircha ${totalPriced} ta markaz narxini yuborgan.` : ''} Aniq narxni markaz sahifasida «Ariza berish» tugmasi orqali bilib olishingiz mumkin.</p>
          <Link className="btn" href={region ? `/search?region=${region.slug}` : '/search'}>Markazlarni ko'rish</Link>
        </div>
      )}

      {region && dRows.length ? (
        <>
          <div className="sec"><h2>Tumanlar bo'yicha</h2><i /></div>
          <div className="pidx-table">
            <div className="pidx-row head" role="row"><span>Tuman va yo'nalish</span><span>Eng arzon</span><span>O'rtacha</span><span>Eng qimmat</span><span>Markazlar</span></div>
            {dRows.map((x) => {
              const d = districts.find((y) => y.id === x.district_id);
              const c = catById[x.category_id];
              if (!d || !c) return null;
              const u = CAT_URL[c.slug];
              return (
                <div className="pidx-row" role="row" key={x.district_id + ':' + x.category_id}>
                  <span className="pidx-cat">{u && d.slug ? <Link href={`/markazlar/${region.slug}/${u}/${d.slug}`}>{`${d.name}: ${c.name}`}</Link> : `${d.name}: ${c.name}`}</span>
                  <span data-l="Eng arzon">{sum(x.p_min)} so'm</span>
                  <span data-l="O'rtacha"><b>{sum(x.p_med)} so'm</b></span>
                  <span data-l="Eng qimmat">{sum(x.p_max)} so'm</span>
                  <span data-l="Markazlar">{x.centers}</span>
                </div>
              );
            })}
          </div>
        </>
      ) : null}

      {pending.length && ready.length ? (
        <p className="muted pidx-note">{`Yana ${pending.length} ta yo'nalish bo'yicha narxlar yetarli emas (${MIN_N} tadan kam markaz) va jadvalga kiritilmadi.`}</p>
      ) : null}

      <section className="card pidx-cta">
        <h2 className="h2">O'quv markazimisiz?</h2>
        <p>Kurslaringiz narxini kabinetda kiriting yoki tasdiqlang — markazingiz qidiruvda narx bilan chiqadi va shu indeksga qo'shiladi.</p>
        <div className="row-btns"><Link className="btn" href="/markaz-kabineti">Markaz kabineti</Link><Link className="btn ghost" href="/hamkorlik">Hamkorlik shartlari</Link></div>
      </section>
    </div>
  );
}
