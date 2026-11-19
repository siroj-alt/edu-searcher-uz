import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { LEVELS } from '../../lib/levels';
import MapView from '../../components/MapView';
import CenterTile from '../../components/CenterTile';
import Tile from '../../components/Tile';
import FilterSheet from '../../components/FilterSheet';
import NearMe from '../../components/NearMe';
import SectionRow from '../../components/SectionRow';
import Pager, { PER_PAGE, pageOf } from '../../components/Pager';
import { loadCenters, inRegion, inDistrict, inSection, inPrice, byFeatured, nearestKm } from '../../lib/points';
import { colorFor, initials, CAT_GLYPH } from '../../lib/cats';
import { regionBySlug, regionById } from '../../lib/regions';
import { sectionBySlug } from '../../lib/sections';
import { Icon } from '../../lib/icons';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: "Markazlar | EduSearcher",
  description: "O'zbekiston bo'ylab o'quv markazlari: bo'lim, yo'nalish, daraja, viloyat, tuman, narx va masofa bo'yicha qidiring.",
  alternates: { canonical: '/search' }
};
const KMS = [2, 5, 10, 25];
const MAXP = 100000000;
const norm = (t) => String(t || '').toLowerCase().replace(/[ʻʼ‘’`']/g, "'").replace(/\s+/g, ' ').trim();
const fmtSum = (n) => (n >= 1e6 ? (n / 1e6).toLocaleString('ru-RU', { maximumFractionDigits: 1 }) + ' mln' : Math.round(n / 1000) + ' ming');
const fmtKm = (k) => (k == null ? null : k < 1 ? Math.round(k * 1000) + ' m' : k.toFixed(1).replace('.', ',') + ' km');
const minPrice = (c) => { const p = c.courses.map((k) => Number(k.price_monthly)).filter((x) => x > 0); return p.length ? Math.min(...p) : null; };
const intOf = (v) => { const n = parseInt(String(v || '').replace(/\D/g, ''), 10); return Number.isFinite(n) && n > 0 && n <= MAXP ? n : 0; };
const X = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17" /></svg>;

export default async function Search({ searchParams, home = false }) {
  const sp = searchParams || {};
  const levelRaw = LEVELS[sp.level] ? sp.level : '';
  const region = regionBySlug(sp.region || '');
  const lat = parseFloat(sp.lat), lng = parseFloat(sp.lng);
  const hasPos = Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
  const q = typeof sp.q === 'string' ? sp.q.slice(0, 60).trim() : '';
  let pmin = intOf(sp.pmin), pmax = intOf(sp.pmax) || intOf(sp.price);
  if (pmin && pmax && pmin > pmax) [pmin, pmax] = [pmax, pmin];
  const section = sectionBySlug(sp.bolim || '');

  const [{ data: catsData }, { data: distData }] = await Promise.all([
    supabase.from('categories').select('id,name,slug').order('id'),
    supabase.from('districts').select('id,name,region_id')
  ]);
  const cats = catsData || [];
  const distName = Object.fromEntries((distData || []).map((d) => [d.id, d.name]));
  const district = region ? (distData || []).find((d) => String(d.id) === String(sp.tuman) && d.region_id === region.id) || null : null;
  const cat = cats.find((c) => String(c.id) === String(sp.cat)) || cats.find((c) => c.slug === sp.cat);
  const hasRef = hasPos || !!region;
  const km = hasRef && KMS.includes(Number(sp.km)) ? Number(sp.km) : 0;
  let sort = ['near', 'rating', 'price'].includes(sp.sort) ? sp.sort : '';
  if (sort === 'near' && !hasRef) sort = '';

  const params = {
    q, bolim: section?.slug || '', cat: cat ? String(cat.id) : '', level: levelRaw, region: region?.slug || '', tuman: district ? String(district.id) : '',
    km: km ? String(km) : '', pmin: pmin ? String(pmin) : '', pmax: pmax ? String(pmax) : '', sort, lat: hasPos ? String(sp.lat) : '', lng: hasPos ? String(sp.lng) : ''
  };
  const link = (over = {}) => {
    const v = { ...params, ...over };
    const u = new URLSearchParams();
    for (const k of ['q', 'bolim', 'cat', 'level', 'region', 'tuman', 'km', 'pmin', 'pmax', 'sort', 'lat', 'lng', 'sahifa']) if (v[k] !== undefined && v[k] !== null && v[k] !== '') u.set(k, String(v[k]));
    const s = u.toString();
    return '/search' + (s ? '?' + s : '');
  };
  const ref = hasPos ? { lat, lng } : region ? { lat: region.lat, lng: region.lng } : null;

  // Tanlangan filtrlar (har birini bitta bosishda olib tashlash mumkin)
  const priceLabel = pmin && pmax ? `${fmtSum(pmin)}–${fmtSum(pmax)} so'm` : pmin ? `${fmtSum(pmin)} so'mdan` : pmax ? `${fmtSum(pmax)} so'mgacha` : '';
  const active = [];
  if (q) active.push([`«${q}»`, link({ q: '' })]);
  if (section) active.push([section.name, link({ bolim: '' })]);
  if (cat) active.push([cat.name, link({ cat: '' })]);
  if (levelRaw) active.push([LEVELS[levelRaw], link({ level: '' })]);
  if (region) active.push([region.short, link({ region: '', tuman: '', km: hasPos ? params.km : '', sort: hasPos ? sort : sort === 'near' ? '' : sort })]);
  if (district) active.push([district.name, link({ tuman: '' })]);
  if (hasPos) active.push(['Joylashuvim', link({ lat: '', lng: '', km: region ? params.km : '', sort: region ? sort : sort === 'near' ? '' : sort })]);
  if (km) active.push([`${km} km gacha`, link({ km: '' })]);
  if (priceLabel) active.push([priceLabel, link({ pmin: '', pmax: '' })]);
  const nFilters = [section, cat, levelRaw, region, district, km, pmin || pmax, hasPos].filter(Boolean).length;

  const nearLabel = hasPos ? 'Eng yaqin' : region ? `${region.short} markaziga yaqin` : 'Eng yaqin';
  const SORTS = [['', cat ? (hasRef ? 'Eng mos' : 'Reyting') : 'Tavsiya'], ...(hasRef ? [['near', nearLabel]] : []), ['rating', 'Baho'], ['price', 'Arzonroq']];
  const where = district ? `${district.name}, ${region.short}` : region ? region.name : "Butun O'zbekiston";

  const toolbar = (n) => (
    <>
      <div className="stool">
        <form action="/search" method="get" className="sq" role="search">
          <Icon name="search" />
          <input type="search" name="q" defaultValue={q} placeholder="Markaz nomi yoki manzil" aria-label="Markaz nomi yoki manzil" maxLength={60} />
          {Object.entries(params).filter(([k, v]) => k !== 'q' && v).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
        </form>
        <FilterSheet cats={cats} init={cat && !levelRaw ? { ...params, level: 'beginner' } : params} count={nFilters} />
      </div>
      <SectionRow active={section?.slug || ''} hrefFor={(s) => link({ bolim: s, cat: '', sahifa: '' })} />
      <div className="sortrow">
        <NearMe params={params} active={hasPos} />
        <span className="vsep" aria-hidden="true" />
        <div className="sorts" role="group" aria-label="Saralash">
          {SORTS.map(([k, t]) => <Link key={k || 'def'} href={link({ sort: k })} className={k === sort ? 'on' : ''} aria-current={k === sort ? 'true' : undefined} scroll={false}>{t}</Link>)}
        </div>
      </div>
      {active.length ? (
        <div className="activef">
          {active.map(([t, href]) => <Link key={t} href={href} className="af" aria-label={`${t} filtrini olib tashlash`}>{t}{X}</Link>)}
          <Link href="/search" className="afclear">Tozalash</Link>
          <span className="afn">{`${n} ta`}</span>
        </div>
      ) : null}
    </>
  );

  const chipCats = section ? section.cats.map((s) => cats.find((c) => c.slug === s)).filter(Boolean) : cats;
  const catChips = (
    <div className="chips scroll catrow">
      <Link href={link({ cat: '', sahifa: '' })} className={!cat ? 'on' : ''}>{section ? `Barcha: ${section.short}` : 'Hammasi'}</Link>
      {chipCats.map((c) => <Link key={c.id} href={link({ cat: c.id, sahifa: '' })} className={cat?.id === c.id ? 'on' : ''}>{c.name}</Link>)}
    </div>
  );

  // ===== Yo'nalish tanlanmagan: markazlar ro'yxati =====
  if (!cat) {
    let centers = inDistrict(inRegion(await loadCenters(), region?.id), district?.id);
    if (q) { const nq = norm(q); centers = centers.filter((c) => norm(c.name).includes(nq) || c.branches.some((b) => norm(b.address).includes(nq))); }
    if (section) centers = inSection(centers, section.cats);
    if (levelRaw) centers = centers.filter((c) => c.courses.some((k) => k.level === levelRaw));
    centers = inPrice(centers, pmin, pmax);
    const dist = new Map();
    if (ref) for (const c of centers) dist.set(c.id, nearestKm(c, ref));
    if (km) centers = centers.filter((c) => dist.get(c.id) <= km);
    if (sort === 'near' || (!sort && hasPos)) centers.sort((a, b) => dist.get(a.id) - dist.get(b.id));
    else if (sort === 'rating') centers.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0) || byFeatured(a, b));
    else if (sort === 'price') centers.sort((a, b) => (minPrice(a) ?? 9e12) - (minPrice(b) ?? 9e12));
    else centers.sort((a, b) => (b.cover_url ? 1 : 0) - (a.cover_url ? 1 : 0) || byFeatured(a, b));

    const pages = Math.max(1, Math.ceil(centers.length / PER_PAGE));
    const page = Math.min(pageOf(sp.sahifa), pages);
    const shown = centers.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    const { data: revData } = shown.length
      ? await supabase.from('center_reviews').select('center_id').in('center_id', shown.map((c) => c.id)).eq('status', 'approved')
      : { data: [] };
    const revN = {};
    for (const r of revData || []) revN[r.center_id] = (revN[r.center_id] || 0) + 1;
    const showKm = ref && (hasPos || sort === 'near' || km);

    return (
      <div className="wrap page spage">
        {!nFilters && !q
          ? <h1 className="h1s h1home">O'zingizga mos o'quv markazini <mark>bir daqiqada</mark> toping</h1>
          : <h1 className="h1s">{section ? `${section.name}: o'quv markazlari` : district ? `${district.name}dagi o'quv markazlari` : region ? `${region.name}dagi o'quv markazlari` : "O'zbekiston bo'ylab o'quv markazlari"}</h1>}
        {toolbar(centers.length)}
        {catChips}
        <div className="sec">
          <h2>{q ? `«${q}» bo'yicha` : where} <span className="muted">({centers.length})</span></h2><i />
          <Link href={'/xarita' + (region ? '?region=' + region.slug : '')}>Xaritada <Icon name="arrow" /></Link>
        </div>
        {shown.length ? (
          <>
            <div className="tiles">{shown.map((c, i) => <CenterTile key={c.id} c={c} i={i} reviews={revN[c.id] || 0} km={showKm ? dist.get(c.id) : null} districts={distName} />)}</div>
            <Pager page={page} pages={pages} href={(n) => link({ sahifa: n > 1 ? n : '' })} />
            {home ? (
              <section className="hcta">
                <div>
                  <h2>O'quv markazingiz bormi?</h2>
                  <p>Markazingizni bepul qo'shing: arizalarni qabul qiling, o'quvchilar va oylik to'lovlarni bitta joyda boshqaring.</p>
                </div>
                <div className="hcta-b">
                  <Link href="/markaz-royxat">Markazni ro'yxatdan o'tkazish</Link>
                  <Link href="/markaz-kabineti" className="ghost">Kabinetga kirish</Link>
                </div>
              </section>
            ) : null}
          </>
        ) : (
          <EmptyState link={link} q={q} km={km} price={pmin || pmax} region={region} district={district} levelRaw={levelRaw} section={section} />
        )}
      </div>
    );
  }

  // ===== Yo'nalish tanlangan: tavsiya qilingan kurslar =====
  const level = levelRaw || 'beginner';
  const r0 = ref || { lat: 41.3111, lng: 69.2797 };
  const { data, error } = await supabase.rpc('recommend_v3', {
    p_category_id: cat.id, p_level: level, p_lat: r0.lat, p_lng: r0.lng,
    p_max_km: hasRef ? km : 0, p_limit: region ? 120 : 160, p_region_id: region?.id ?? null
  });
  let rows = data || [];
  const branchIds = [...new Set(rows.map((r) => r.branch_id))];
  const { data: brData } = branchIds.length ? await supabase.from('branches').select('id,district_id').in('id', branchIds.slice(0, 300)) : { data: [] };
  const brDist = Object.fromEntries((brData || []).map((b) => [b.id, b.district_id]));
  if (district) rows = rows.filter((r) => brDist[r.branch_id] === district.id);
  if (q) { const nq = norm(q); rows = rows.filter((r) => norm(r.center_name).includes(nq) || norm(r.address).includes(nq)); }
  if (pmin || pmax) rows = rows.filter((r) => { const p = Number(r.price_monthly); return p > 0 && (!pmin || p >= pmin) && (!pmax || p <= pmax); });
  if (!hasRef) rows = [...rows].sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
  if (sort === 'near') rows = [...rows].sort((a, b) => (a.distance_km ?? 9e9) - (b.distance_km ?? 9e9));
  if (sort === 'rating') rows = [...rows].sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
  if (sort === 'price') rows = [...rows].sort((a, b) => (Number(a.price_monthly) || 9e12) - (Number(b.price_monthly) || 9e12));
  const bestCenter = hasRef && !sort && !pmin && !pmax && rows[0] ? rows[0].center_id : null;

  const centerIds = [...new Set(rows.map((r) => r.center_id))].slice(0, 150);
  const [featRes, cRes, revRes] = await Promise.all([
    supabase.from('centers').select('id').eq('is_featured', true),
    centerIds.length ? supabase.from('centers').select('id,cover_url,is_verified').in('id', centerIds) : Promise.resolve({ data: [] }),
    centerIds.length ? supabase.from('center_reviews').select('center_id').in('center_id', centerIds).eq('status', 'approved') : Promise.resolve({ data: [] })
  ]);
  const featured = new Set((featRes.data || []).map((x) => x.id));
  const cinfo = Object.fromEntries((cRes.data || []).map((x) => [x.id, x]));
  const revN = {};
  for (const r of revRes.data || []) revN[r.center_id] = (revN[r.center_id] || 0) + 1;
  if (featured.size && !sort) rows = [...rows.filter((r) => featured.has(r.center_id)), ...rows.filter((r) => !featured.has(r.center_id))];

  const color = colorFor(cat.slug);
  const seenB = new Set(), points = [];
  for (const r of rows) {
    if (r.lat == null || seenB.has(r.branch_id)) continue;
    seenB.add(r.branch_id);
    points.push({ id: r.branch_id, centerId: r.center_id, name: r.center_name, address: r.address, lat: r.lat, lng: r.lng, color, rating: r.rating });
  }
  // Har bir markaz bir marta (eng mos filiali bilan) ko'rsatiladi
  const seenC = new Set(), tiles = [];
  for (const r of rows) {
    if (seenC.has(r.center_id)) continue;
    seenC.add(r.center_id);
    const reg = regionById(r.region_id);
    const dn = distName[brDist[r.branch_id]];
    tiles.push({
      id: r.center_id, name: r.center_name, cover: cinfo[r.center_id]?.cover_url || null, color, glyph: CAT_GLYPH[cat.slug] || 'Edu', initials: initials(r.center_name),
      badge: r.center_id === bestCenter ? 'best' : featured.has(r.center_id) ? 'feat' : null, verified: !!cinfo[r.center_id]?.is_verified,
      sub: `${r.course_name && !norm(r.course_name).startsWith(norm(cat.name)) ? r.course_name : cat.name} · ${LEVELS[level]}`,
      price: r.price_monthly ? `${Number(r.price_monthly).toLocaleString('ru-RU')} so'm/oy` : 'Narx kelishiladi',
      place: dn || (reg ? reg.short : "O'zbekiston"),
      km: hasRef ? fmtKm(r.distance_km) : null, rating: Number(r.rating) || 0, reviews: revN[r.center_id] || 0,
      phone: r.phone || null, telegram: r.telegram || null
    });
  }

  return (
    <div className="wrap page spage">
      <div className="rhead">
        <small className="muted">{`${cat.name} · ${LEVELS[level]} · ${where}${km ? ` · ${km} km gacha` : ''}`}</small>
        <h1 className="h1s">Sizga mos markazlar</h1>
      </div>
      {toolbar(tiles.length)}
      {catChips}
      <p className="note">
        <Icon name="pin" />
        {hasPos ? <>Masofa sizning joylashuvingizdan hisoblandi.</>
          : region ? <>Masofa {region.short} markazidan hisoblandi. Aniqroq natija uchun «Menga yaqin» tugmasini bosing.</>
          : <>Butun O'zbekiston bo'yicha, baho tartibida. Yaqin markazlar uchun «Menga yaqin» tugmasini bosing.</>}
        {error ? <span className="err"> Ma'lumot yuklanmadi, sahifani yangilang.</span> : null}
      </p>
      {tiles.length === 0 ? (
        <EmptyState link={link} q={q} km={km} price={pmin || pmax} region={region} district={district} levelRaw={levelRaw} cat={cat} />
      ) : (
        <div className="rgrid tgrid">
          <div className="tiles">{tiles.map((t, i) => <Tile key={t.id} t={t} i={i} />)}</div>
          <div className="rmap">
            <MapView points={points} userPos={hasPos ? [lat, lng] : null} center={region ? [region.lat, region.lng] : null} />
          </div>
        </div>
      )}
    </div>
  );
}

// Natija topilmaganda: filtrni kengaytirish bo'yicha aniq takliflar
function EmptyState({ link, q, km, price, region, district, levelRaw, cat, section }) {
  const tips = [];
  if (km) tips.push([km < 25 ? `Masofani ${km < 10 ? 10 : 25} km gacha oshirish` : 'Masofa cheklovini olib tashlash', link({ km: km < 10 ? 10 : km < 25 ? 25 : '' })]);
  if (price) tips.push(['Narx chegarasini olib tashlash', link({ pmin: '', pmax: '' })]);
  if (district) tips.push([`Butun ${region.short} bo'yicha qidirish`, link({ tuman: '' })]);
  if (levelRaw) tips.push(["Boshqa darajalarni ham ko'rsatish", link({ level: '' })]);
  if (q) tips.push([`«${q}» qidiruvini tozalash`, link({ q: '' })]);
  if (section && !cat) tips.push(["Barcha bo'limlar bo'yicha qidirish", link({ bolim: '' })]);
  if (cat && !tips.length) tips.push(["Barcha yo'nalishlar bo'yicha qidirish", link({ cat: '' })]);
  return (
    <div className="empty glass-soft">
      <span className="empty-ic" aria-hidden="true">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5M8.5 11h5" /></svg>
      </span>
      <h2 className="h2">Bu filtr bo'yicha markaz topilmadi</h2>
      <p className="muted">Filtrni biroz kengaytirib ko'ring:</p>
      <div className="empty-tips">
        {tips.map(([t, h]) => <Link key={t} className="btn ghost" href={h}>{t}</Link>)}
        {region ? <Link className="btn" href={link({ region: '', tuman: '', km: '', sort: '' })}>Butun O'zbekiston bo'ylab qidirish</Link>
          : <Link className="btn" href="/search">Barcha markazlarni ko'rish</Link>}
      </div>
      <p className="muted empty-own">O'quv markazingiz shu yo'nalishdami? <Link className="ok" href="/markaz-royxat">Markazni qo'shing</Link></p>
    </div>
  );
}
