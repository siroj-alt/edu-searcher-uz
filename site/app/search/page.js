import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { LEVELS } from '../../lib/levels';
import MapView from '../../components/MapView';
import CenterTile from '../../components/CenterTile';
import SaveButton from '../../components/SaveButton';
import CompareToggle from '../../components/CompareToggle';
import FilterSheet from '../../components/FilterSheet';
import NearMe from '../../components/NearMe';
import { Spark } from '../../components/Glyphs';
import Pager, { PER_PAGE, pageOf } from '../../components/Pager';
import { loadCenters, inRegion, byFeatured, nearestKm } from '../../lib/points';
import { colorFor, initials, tel, url, fmtKm } from '../../lib/cats';
import { regionBySlug, regionById } from '../../lib/regions';
import { Icon } from '../../lib/icons';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: "Markazlar | EduSearcher",
  description: "O'zbekiston bo'ylab o'quv markazlari: yo'nalish, daraja, viloyat, narx va masofa bo'yicha qidiring.",
  alternates: { canonical: '/search' }
};
const ext = { target: '_blank', rel: 'noopener noreferrer' };
const KMS = [2, 5, 10, 25];
const PRICES = [300000, 500000, 1000000];
const norm = (t) => String(t || '').toLowerCase().replace(/[ʻʼ‘’`']/g, "'").replace(/\s+/g, ' ').trim();
const fmtSum = (n) => (n >= 1e6 ? (n / 1e6).toLocaleString('ru-RU') + ' mln' : Math.round(n / 1000) + ' ming');
const tgHref = (t) => (/^https?:/i.test(t) ? t : 'https://t.me/' + String(t).replace(/^@/, ''));
const minPrice = (c) => { const p = c.courses.map((k) => Number(k.price_monthly)).filter((x) => x > 0); return p.length ? Math.min(...p) : null; };
const X = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17" /></svg>;

export default async function Search({ searchParams }) {
  const sp = searchParams || {};
  const levelRaw = LEVELS[sp.level] ? sp.level : '';
  const region = regionBySlug(sp.region || '');
  const lat = parseFloat(sp.lat), lng = parseFloat(sp.lng);
  const hasPos = Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
  const kmRaw = KMS.includes(Number(sp.km)) ? Number(sp.km) : 0;
  const q = typeof sp.q === 'string' ? sp.q.slice(0, 60).trim() : '';
  const price = PRICES.includes(Number(sp.price)) ? Number(sp.price) : 0;
  const hasRef = hasPos || !!region;
  const km = hasRef ? kmRaw : 0;
  let sort = ['near', 'rating', 'price'].includes(sp.sort) ? sp.sort : '';
  if (sort === 'near' && !hasRef) sort = '';

  const { data: catsData } = await supabase.from('categories').select('id,name,slug').order('id');
  const cats = catsData || [];
  const cat = cats.find((c) => String(c.id) === String(sp.cat)) || cats.find((c) => c.slug === sp.cat);

  const params = { q, cat: cat ? String(cat.id) : '', level: levelRaw, region: region?.slug || '', km: km ? String(km) : '', price: price ? String(price) : '', sort, lat: hasPos ? String(sp.lat) : '', lng: hasPos ? String(sp.lng) : '' };
  const link = (over = {}) => {
    const v = { ...params, ...over };
    const u = new URLSearchParams();
    for (const k of ['q', 'cat', 'level', 'region', 'km', 'price', 'sort', 'lat', 'lng', 'sahifa']) if (v[k] !== undefined && v[k] !== null && v[k] !== '') u.set(k, String(v[k]));
    const s = u.toString();
    return '/search' + (s ? '?' + s : '');
  };
  const ref = hasPos ? { lat, lng } : region ? { lat: region.lat, lng: region.lng } : null;

  // Tanlangan filtrlar (har birini bitta bosishda olib tashlash mumkin)
  const active = [];
  if (q) active.push([`«${q}»`, link({ q: '' })]);
  if (cat) active.push([cat.name, link({ cat: '' })]);
  if (levelRaw) active.push([LEVELS[levelRaw], link({ level: '' })]);
  if (region) active.push([region.short, link({ region: '', km: hasPos ? params.km : '', sort: hasPos ? sort : sort === 'near' ? '' : sort })]);
  if (hasPos) active.push(['Joylashuvim', link({ lat: '', lng: '', km: region ? params.km : '', sort: region ? sort : sort === 'near' ? '' : sort })]);
  if (km) active.push([`${km} km gacha`, link({ km: '' })]);
  if (price) active.push([`${fmtSum(price)} gacha`, link({ price: '' })]);
  const nFilters = [cat, levelRaw, region, km, price, hasPos].filter(Boolean).length;

  const nearLabel = hasPos ? 'Eng yaqin' : region ? `${region.short} markaziga yaqin` : 'Eng yaqin';
  const SORTS = [['', cat ? (hasRef ? 'Eng mos' : 'Reyting') : 'Tavsiya'], ...(hasRef ? [['near', nearLabel]] : []), ['rating', 'Baho'], ['price', 'Arzonroq']];

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

  const catChips = (
    <div className="chips scroll catrow">
      <Link href={link({ cat: '', sahifa: '' })} className={!cat ? 'on' : ''}>Hammasi</Link>
      {cats.map((c) => <Link key={c.id} href={link({ cat: c.id })} className={cat?.id === c.id ? 'on' : ''}>{c.name}</Link>)}
    </div>
  );

  // ===== Yo'nalish tanlanmagan: markazlar ro'yxati =====
  if (!cat) {
    let centers = inRegion(await loadCenters(), region?.id);
    if (q) { const nq = norm(q); centers = centers.filter((c) => norm(c.name).includes(nq) || c.branches.some((b) => norm(b.address).includes(nq))); }
    if (levelRaw) centers = centers.filter((c) => c.courses.some((k) => k.level === levelRaw));
    if (price) centers = centers.filter((c) => { const m = minPrice(c); return m != null && m <= price; });
    const dist = new Map();
    if (ref) for (const c of centers) dist.set(c.id, nearestKm(c, ref));
    if (km) centers = centers.filter((c) => dist.get(c.id) <= km);
    if (sort === 'near' || (!sort && hasPos)) centers.sort((a, b) => dist.get(a.id) - dist.get(b.id));
    else if (sort === 'rating') centers.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0) || byFeatured(a, b));
    else if (sort === 'price') centers.sort((a, b) => (minPrice(a) ?? 9e12) - (minPrice(b) ?? 9e12));
    else centers.sort(byFeatured);

    const pages = Math.max(1, Math.ceil(centers.length / PER_PAGE));
    const page = Math.min(pageOf(sp.sahifa), pages);
    const shown = centers.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    const { data: revData } = shown.length
      ? await supabase.from('center_reviews').select('center_id').in('center_id', shown.map((c) => c.id)).eq('status', 'approved')
      : { data: [] };
    const revN = {};
    for (const r of revData || []) revN[r.center_id] = (revN[r.center_id] || 0) + 1;

    return (
      <div className="wrap page spage">
        <h1 className="h1s">{region ? `${region.name}dagi o'quv markazlari` : "O'zbekiston bo'ylab o'quv markazlari"}</h1>
        {toolbar(centers.length)}
        {catChips}
        <div className="sec">
          <h2>{q ? `«${q}» bo'yicha` : 'Markazlar'} <span className="muted">({centers.length})</span></h2><i />
          <Link href={'/xarita' + (region ? '?region=' + region.slug : '')}>Xaritada <Icon name="arrow" /></Link>
        </div>
        {shown.length ? (
          <>
            <div className="ccards">{shown.map((c, i) => <CenterTile key={c.id} c={c} i={Math.min(i, 12)} reviews={revN[c.id] || 0} km={ref && (hasPos || sort === 'near' || km) ? dist.get(c.id) : null} />)}</div>
            <Pager page={page} pages={pages} href={(n) => link({ sahifa: n > 1 ? n : '' })} />
          </>
        ) : (
          <EmptyState link={link} q={q} km={km} price={price} region={region} levelRaw={levelRaw} />
        )}
      </div>
    );
  }

  // ===== Yo'nalish tanlangan: tavsiya qilingan kurslar =====
  const level = levelRaw || 'beginner';
  const r0 = ref || { lat: 41.3111, lng: 69.2797 };
  const { data, error } = await supabase.rpc('recommend_v3', {
    p_category_id: cat.id, p_level: level, p_lat: r0.lat, p_lng: r0.lng,
    p_max_km: hasRef ? km : 0, p_limit: region ? 80 : 120, p_region_id: region?.id ?? null
  });
  let rows = data || [];
  if (q) { const nq = norm(q); rows = rows.filter((r) => norm(r.center_name).includes(nq) || norm(r.address).includes(nq)); }
  if (!hasRef) rows = [...rows].sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
  if (sort === 'near') rows = [...rows].sort((a, b) => (a.distance_km ?? 9e9) - (b.distance_km ?? 9e9));
  const bestId = hasRef && !sort && rows[0] ? rows[0].course_id + rows[0].branch_id : null;
  if (price) rows = rows.filter((r) => Number(r.price_monthly) > 0 && Number(r.price_monthly) <= price);
  if (sort === 'rating') rows = [...rows].sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
  if (sort === 'price') rows = [...rows].sort((a, b) => (Number(a.price_monthly) || 9e12) - (Number(b.price_monthly) || 9e12));
  const centerIds = [...new Set(rows.map((r) => r.center_id))].slice(0, 150);
  const [featRes, covRes, revRes] = await Promise.all([
    supabase.from('centers').select('id').eq('is_featured', true),
    centerIds.length ? supabase.from('centers').select('id,cover_url').in('id', centerIds).not('cover_url', 'is', null) : Promise.resolve({ data: [] }),
    centerIds.length ? supabase.from('center_reviews').select('center_id').in('center_id', centerIds).eq('status', 'approved') : Promise.resolve({ data: [] })
  ]);
  const featured = new Set((featRes.data || []).map((x) => x.id));
  const covers = Object.fromEntries((covRes.data || []).map((x) => [x.id, x.cover_url]));
  const revN = {};
  for (const r of revRes.data || []) revN[r.center_id] = (revN[r.center_id] || 0) + 1;
  if (featured.size && !sort) rows = [...rows.filter((r) => featured.has(r.center_id)), ...rows.filter((r) => !featured.has(r.center_id))];

  const color = colorFor(cat.slug);
  const seen = new Set();
  const points = [];
  for (const r of rows) {
    if (r.lat == null || seen.has(r.branch_id)) continue;
    seen.add(r.branch_id);
    points.push({ id: r.branch_id, centerId: r.center_id, name: r.center_name, address: r.address, lat: r.lat, lng: r.lng, color, rating: r.rating });
  }

  return (
    <div className="wrap page spage">
      <div className="rhead">
        <small className="muted">{cat.name} · {LEVELS[level]} · {region ? region.name : "Butun O'zbekiston"}{km ? ` · ${km} km gacha` : ''}</small>
        <h1 className="h1s">Sizga mos markazlar</h1>
      </div>
      {toolbar(rows.length)}
      {catChips}
      <p className="note">
        <Icon name="pin" />
        {hasPos ? <>Masofa sizning joylashuvingizdan hisoblandi.</>
          : region ? <>Masofa {region.short} markazidan hisoblandi. Aniqroq natija uchun «Menga yaqin» tugmasini bosing.</>
          : <>Butun O'zbekiston bo'yicha, baho tartibida. Yaqin markazlar uchun «Menga yaqin» tugmasini bosing.</>}
        {error ? <span className="err"> Ma'lumot yuklanmadi, sahifani yangilang.</span> : null}
      </p>
      {rows.length === 0 ? (
        <EmptyState link={link} q={q} km={km} price={price} region={region} levelRaw={levelRaw} cat={cat} />
      ) : (
        <div className="rgrid">
          <div className="rlist">
            {rows.map((r, i) => {
              const reg = regionById(r.region_id);
              const isBest = r.course_id + r.branch_id === bestId && !price;
              const isFeat = featured.has(r.center_id);
              const rating = Number(r.rating) || 0;
              return (
                <div key={r.course_id + r.branch_id} data-center={r.center_id} className={'rcard' + (isBest ? ' best' : '') + (isFeat ? ' feat' : '')} style={{ '--i': Math.min(i, 12) }}>
                  {covers[r.center_id] ? <Link href={"/centers/" + r.center_id} className="rcov" tabIndex={-1} aria-hidden="true"><img src={covers[r.center_id]} alt="" loading="lazy" decoding="async" /></Link> : null}
                  {isBest && <span className="bestb">Eng mos natija</span>}
                  {isFeat && <span className="featb"><Spark width="12" height="12" style={{ verticalAlign: '-1px', marginRight: 3 }} />Tavsiya etilgan</span>}
                  <div className="rh">
                    <div className="av" style={{ background: color }}>{initials(r.center_name)}</div>
                    <div className="rn">
                      <Link href={`/centers/${r.center_id}`}><b>{r.center_name}</b></Link>
                      <small><Icon name="pin" />{!region && reg && !String(r.address).toLowerCase().includes(reg.short.slice(0, 5).toLowerCase()) ? reg.short + ', ' : ''}{r.address}</small>
                    </div>
                    {hasRef ? <span className="kmb">{fmtKm(r.distance_km)}</span> : reg ? <span className="kmb">{reg.short}</span> : null}
                  </div>
                  <div className="rinfo">
                    {rating > 0 ? <span className="st"><Icon name="star" />{rating.toFixed(1)}{revN[r.center_id] ? <small>{` · ${revN[r.center_id]} sharh`}</small> : null}</span> : null}
                    <span className="bd">{r.course_name && !norm(r.course_name).startsWith(norm(cat.name)) ? r.course_name : cat.name} · {LEVELS[level]}</span>
                    <span className="pr">{r.price_monthly ? `${Number(r.price_monthly).toLocaleString('ru-RU')} so'm/oy` : 'Narx kelishiladi'}</span>
                    {r.schedule ? <span>{r.schedule}</span> : null}
                  </div>
                  <div className="racts">
                    <Link className="g" href={`/centers/${r.center_id}`}>Batafsil</Link>
                    {r.phone ? <a className="g" href={tel(r.phone)}><Icon name="phone" />Qo'ng'iroq</a> : null}
                    {r.telegram ? <a className="g tg" href={tgHref(r.telegram)} {...ext}><Icon name="send" />Telegram</a> : null}
                    {!r.phone && !r.telegram && r.website ? <a className="g" href={url(r.website)} {...ext}><Icon name="globe" />Sayt</a> : null}
                    <Link className="p" href={`/centers/${r.center_id}#ariza`}>Ariza</Link>
                    <CompareToggle id={r.center_id} variant="ic" />
                    <SaveButton id={r.center_id} compact />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="rmap">
            <MapView points={points} userPos={hasPos ? [lat, lng] : null} center={region ? [region.lat, region.lng] : null} />
          </div>
        </div>
      )}
    </div>
  );
}

// Natija topilmaganda: filtrni kengaytirish bo'yicha aniq takliflar
function EmptyState({ link, q, km, price, region, levelRaw, cat }) {
  const tips = [];
  if (km) tips.push([km < 25 ? `Masofani ${km < 10 ? 10 : 25} km gacha oshirish` : 'Masofa cheklovini olib tashlash', link({ km: km < 10 ? 10 : km < 25 ? 25 : '' })]);
  if (price) tips.push(['Narx chegarasini olib tashlash', link({ price: '' })]);
  if (levelRaw) tips.push(['Boshqa darajalarni ham ko\'rsatish', link({ level: '' })]);
  if (q) tips.push([`«${q}» qidiruvini tozalash`, link({ q: '' })]);
  if (cat && !tips.length) tips.push(["Barcha yo'nalishlar bo'yicha qidirish", link({ cat: '' })]);
  return (
    <div className="empty glass-soft">
      <span className="empty-ic" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5M8.5 11h5" /></svg>
      </span>
      <h2 className="h2">Bu filtr bo'yicha markaz topilmadi</h2>
      <p className="muted">Filtrni biroz kengaytirib ko'ring:</p>
      <div className="empty-tips">
        {tips.map(([t, h]) => <Link key={t} className="btn ghost" href={h}>{t}</Link>)}
        {region ? <Link className="btn" href={link({ region: '', km: '', sort: '' })}>Butun O'zbekiston bo'ylab qidirish</Link>
          : <Link className="btn" href="/search">Barcha markazlarni ko'rish</Link>}
      </div>
    </div>
  );
}
