import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { LEVELS } from '../../../lib/levels';
import { colorFor, initials, tel, url, host } from '../../../lib/cats';
import { regionById } from '../../../lib/regions';
import { slugsOf, regionIdsOf } from '../../../lib/points';
import { SITE, CAT_URL, jsonLd, fmtDate, UUID_RE, OG_IMAGES } from '../../../lib/seo';
import { Icon } from '../../../lib/icons';
import MapView from '../../../components/MapView';
import CenterTile from '../../../components/CenterTile';
import SaveButton from '../../../components/SaveButton';
import ApplyForm from '../../../components/ApplyForm';
import ReviewForm from '../../../components/ReviewForm';
import CenterGallery from '../../../components/CenterGallery';
import CompareToggle from '../../../components/CompareToggle';
import ShareButton from '../../../components/ShareButton';
import StickyCta from '../../../components/StickyCta';
import { Shield, Spark, Stars, Cap } from '../../../components/Glyphs';

export const dynamic = 'force-dynamic';

const ext = { target: '_blank', rel: 'noopener noreferrer' };
const LEVEL_ORDER = { beginner: 0, intermediate: 1, advanced: 2 };
const FIELDS = 'id,name,description,website,telegram,instagram,phone,rating,is_verified,is_featured,updated_at,created_at,cover_url,center_photos(id,url,thumb_url,is_cover,sort),' +
  'branches(id,address,phone,lat,lng,region_id),courses(id,name,level,price_monthly,duration_months,schedule,categories(id,slug,name))';
const REL_FIELDS = 'id,name,rating,phone,telegram,website,is_verified,is_featured,cover_url,branches!inner(id,address,lat,lng,region_id),courses(level,price_monthly,categories(slug,name))';

async function getCenter(id) {
  if (!UUID_RE.test(id || '')) return null;
  const { data } = await supabase.from('centers').select(FIELDS).eq('id', id).maybeSingle();
  if (!data) return null;
  data.branches = data.branches || [];
  data.courses = data.courses || [];
  return data;
}

const tgHref = (t) => (/^https?:/i.test(t) ? t : 'https://t.me/' + t.replace(/^@/, ''));
const igHref = (t) => (/^https?:/i.test(t) ? t : 'https://instagram.com/' + t.replace(/^@/, ''));
const handle = (u) => '@' + String(u).replace(/^https?:\/\/(www\.)?(t\.me|instagram\.com)\//i, '').replace(/[/?].*$/, '').replace(/^@/, '');
const short = (n) => (n >= 1e6 ? (n / 1e6).toLocaleString('ru-RU', { maximumFractionDigits: 1 }) + ' mln' : Math.round(n / 1000) + ' ming');

function regionsText(c) {
  return regionIdsOf(c).map((id) => regionById(id)?.name).filter(Boolean);
}

export async function generateMetadata({ params }) {
  const c = await getCenter(params.id);
  if (!c) return { title: 'Markaz topilmadi | EduSearcher', robots: { index: false } };
  const cats = [...new Set(c.courses.map((k) => k.categories?.name).filter(Boolean))];
  const regs = regionsText(c);
  const where = regs.length === 1 ? regs[0] : regs.length ? `${regs.length} ta viloyat` : "O'zbekiston";
  const title = `${c.name} — ${where} | EduSearcher`;
  const desc = (c.description && c.description.trim().length > 30)
    ? c.description.trim().slice(0, 180)
    : `${c.name}: ${cats.slice(0, 4).join(', ') || "o'quv kurslari"}. ${c.branches.length} ta filial, manzil, telefon va narxlar.`;
  const images = c.cover_url ? [{ url: c.cover_url, alt: c.name }] : OG_IMAGES;
  return {
    title, description: desc,
    alternates: { canonical: `/centers/${c.id}` },
    openGraph: { type: 'website', url: `/centers/${c.id}`, title, description: desc, siteName: 'EduSearcher', locale: 'uz_UZ', images },
    twitter: { card: 'summary_large_image', title, description: desc, images }
  };
}

export default async function CenterPage({ params }) {
  const c = await getCenter(params.id);
  if (!c) notFound();

  const regIds = regionIdsOf(c);
  const [revRes, relRes] = await Promise.all([
    supabase.from('center_reviews').select('id,name,stars,comment,created_at').eq('center_id', c.id).eq('status', 'approved').order('created_at', { ascending: false }).limit(50),
    regIds.length
      ? supabase.from('centers').select(REL_FIELDS).eq('branches.region_id', regIds[0]).neq('id', c.id).limit(120)
      : Promise.resolve({ data: [] })
  ]);
  const reviews = revRes.data || [];
  const all = (relRes.data || []).map((x) => ({ ...x, branches: x.branches || [], courses: x.courses || [] }));
  const revAvg = reviews.length ? reviews.reduce((s, r) => s + r.stars, 0) / reviews.length : 0;
  const score = revAvg || Number(c.rating) || 0;

  const slugs = slugsOf(c);
  const color = colorFor(slugs[0]);
  const catNames = [...new Set(c.courses.map((k) => k.categories?.name).filter(Boolean))];
  const region = regionById(regIds[0]);
  const points = c.branches.filter((b) => b.lat != null && b.lng != null).map((b) => ({
    id: b.id, centerId: c.id, name: c.name, address: b.address, lat: b.lat, lng: b.lng, color, rating: c.rating
  }));

  // Kurslar yo'nalish bo'yicha guruhlanadi
  const groups = {};
  for (const k of c.courses) {
    const cat = k.categories;
    if (!cat) continue;
    (groups[cat.slug] = groups[cat.slug] || { cat, list: [] }).list.push(k);
  }
  const groupList = Object.values(groups).sort((a, b) => a.cat.id - b.cat.id);
  for (const g of groupList) g.list.sort((a, b) => (LEVEL_ORDER[a.level] ?? 9) - (LEVEL_ORDER[b.level] ?? 9));
  const prices = c.courses.map((k) => Number(k.price_monthly)).filter((p) => p > 0);
  const minPrice = prices.length ? Math.min(...prices) : null;
  const levels = Object.keys(LEVEL_ORDER).filter((l) => c.courses.some((k) => k.level === l));
  const courseOpts = groupList.flatMap((g) => g.list.map((k) => ({ id: k.id, name: k.name, price: k.price_monthly || null })));

  // O'xshash markazlar: shu viloyatda, umumiy yo'nalishli
  const related = all
    .filter((x) => x.id !== c.id && slugsOf(x).some((s) => slugs.includes(s)))
    .sort((a, b) => (b.is_featured === true) - (a.is_featured === true) || (Number(b.rating) || 0) - (Number(a.rating) || 0))
    .slice(0, 3);

  const pageUrl = `${SITE}/centers/${c.id}`;
  const sameAs = [c.website && url(c.website), c.telegram && tgHref(c.telegram), c.instagram && igHref(c.instagram)].filter(Boolean);
  const b0 = c.branches[0];
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'EducationalOrganization', '@id': pageUrl + '#org', name: c.name, url: pageUrl,
        ...(c.description ? { description: c.description } : {}),
        ...(c.phone ? { telephone: c.phone } : {}),
        ...(c.cover_url ? { image: c.cover_url } : {}),
        ...(sameAs.length ? { sameAs } : {}),
        ...(b0 ? { address: { '@type': 'PostalAddress', streetAddress: b0.address, ...(region ? { addressRegion: region.name } : {}), addressCountry: 'UZ' } } : {}),
        ...(b0 && b0.lat != null ? { geo: { '@type': 'GeoCoordinates', latitude: b0.lat, longitude: b0.lng } } : {}),
        ...(reviews.length ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: Number(revAvg.toFixed(1)), reviewCount: reviews.length, bestRating: 5, worstRating: 1 } } : {}),
        ...(groupList.length ? {
          hasOfferCatalog: {
            '@type': 'OfferCatalog', name: 'Kurslar',
            itemListElement: groupList.map((g) => ({ '@type': 'Offer', itemOffered: { '@type': 'Course', name: g.cat.name, provider: { '@id': pageUrl + '#org' } } }))
          }
        } : {})
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Bosh sahifa', item: SITE + '/' },
          ...(region ? [{ '@type': 'ListItem', position: 2, name: region.name, item: `${SITE}/markazlar/${region.slug}` }] : []),
          { '@type': 'ListItem', position: region ? 3 : 2, name: c.name, item: pageUrl }
        ]
      }
    ]
  };

  return (
    <div className="wrap page cpage" data-center={c.id}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} />
      <nav className="crumbs" aria-label="Sahifa yo'li">
        <Link href="/">Bosh sahifa</Link><span aria-hidden="true">/</span>
        {region ? <><Link href={`/markazlar/${region.slug}`}>{region.name}</Link><span aria-hidden="true">/</span></> : <><Link href="/search">Markazlar</Link><span aria-hidden="true">/</span></>}
        <span>{c.name}</span>
      </nav>

      <CenterGallery photos={c.center_photos || []} name={c.name} />
      <section className="card chero">
        <div className="chead">
          {c.cover_url ? <img className="av lg pic" src={c.cover_url} alt="" /> : <div className="av lg" style={{ background: color }}>{initials(c.name)}</div>}
          <div className="hmain">
            <div className="h1row">
              <h1 className="h1s">{c.name}</h1>
              {c.is_verified ? <span className="vbadge" title="Ma'lumotlari tekshirilgan"><Shield />Tasdiqlangan</span> : null}
              {c.is_featured ? <span className="fbadge"><Spark />Tavsiya etilgan</span> : null}
            </div>
            <div className="cline">
              {score > 0 ? <a href="#sharhlar" className="cstar"><Icon name="star" /><b>{score.toFixed(1)}</b>{reviews.length ? ` · ${reviews.length} sharh` : ''}</a> : <a href="#sharhlar" className="cstar none">Hali baho yo'q</a>}
              <span>·</span>
              <span>{region ? region.short : "O'zbekiston"}{c.branches.length > 1 ? `, ${c.branches.length} ta filial` : ''}</span>
            </div>
            <div className="tags">
              {catNames.map((n) => <span key={n} className="tag">{n}</span>)}
            </div>
          </div>
        </div>
        <div className="cfacts">
          <div><small>Narx</small><b>{minPrice ? `${short(minPrice)} so'mdan` : 'Kelishiladi'}</b></div>
          <div><small>Daraja</small><b>{levels.length ? (levels.length === 3 ? 'Barcha darajalar' : levels.map((l) => LEVELS[l]).join(', ')) : '—'}</b></div>
          <div><small>Filiallar</small><b>{`${c.branches.length} ta`}</b></div>
        </div>
        <div className="actions" id="center-actions">
          <a className="btn" href="#ariza"><Cap width="18" height="18" />O'qishga ariza berish</a>
          {c.phone ? <a className="btn ghost" href={tel(c.phone)}><Icon name="phone" />Qo'ng'iroq</a> : null}
          {c.telegram ? <a className="btn ghost" href={tgHref(c.telegram)} {...ext}><Icon name="send" />Telegram</a> : null}
          {c.website ? <a className="btn ghost" href={url(c.website)} {...ext}><Icon name="globe" />Veb-sayt</a> : null}
          {c.instagram ? <a className="btn ghost" href={igHref(c.instagram)} {...ext}>Instagram</a> : null}
          <SaveButton id={c.id} />
          <ShareButton title={c.name} text={`${c.name} — EduSearcher`} />
          <CompareToggle id={c.id} variant="btn ghost" />
        </div>
        {c.updated_at ? <p className="updated">Ma'lumot yangilangan: {fmtDate(c.updated_at)}</p> : null}
      </section>

      <div className="layout2">
        <section className="card">
          <h2 className="h2">Qisqacha ma'lumot</h2>
          <p className="about">{c.description || `${c.name} — ${region ? region.name + 'dagi' : ''} o'quv markazi. Yo'nalishlar: ${catNames.join(', ') || "ma'lumot kiritilmagan"}.`}</p>
          {minPrice ? <p className="about" style={{ marginTop: 10 }}>Narxlar: oyiga <b className="ok">{minPrice.toLocaleString('ru-RU')} so'm</b>dan boshlab.</p> : null}
        </section>
        <section className="card">
          <h2 className="h2">Aloqa</h2>
          {c.phone ? <div className="crow"><span className="muted">Telefon</span><a href={tel(c.phone)}>{c.phone}</a></div> : null}
          {c.website ? <div className="crow"><span className="muted">Veb-sayt</span><a href={url(c.website)} {...ext}>{host(c.website).slice(0, 40)}</a></div> : null}
          {c.telegram ? <div className="crow"><span className="muted">Telegram</span><a href={tgHref(c.telegram)} {...ext}>{handle(c.telegram)}</a></div> : null}
          {c.instagram ? <div className="crow"><span className="muted">Instagram</span><a href={igHref(c.instagram)} {...ext}>{handle(c.instagram)}</a></div> : null}
          {!c.phone && !c.website && !c.telegram && !c.instagram ? <p className="muted">Markaz bilan bog'lanish uchun pastdagi forma orqali o'qishga ariza qoldiring: markaz siz bilan o'zi bog'lanadi.</p> : null}
        </section>
      </div>

      {groupList.length ? (
        <>
          <div className="sec"><h2>Kurslar</h2><i /></div>
          <div className="grid2">
            {groupList.map((g) => (
              <div key={g.cat.slug} className="card">
                <h3 style={{ marginBottom: 6 }}>{g.cat.name}</h3>
                {g.list.map((k) => (
                  <div key={k.id} className="crow">
                    <span>{k.name && k.name.trim() && !k.name.trim().toLowerCase().startsWith(g.cat.name.toLowerCase()) ? <><b>{k.name.trim()}</b> · </> : null}{LEVELS[k.level] || k.level}{k.duration_months ? <small className="muted">{` · ${k.duration_months} oy`}</small> : null}{k.schedule ? <small className="muted"> · {k.schedule}</small> : null}</span>
                    <span className="kmb">{k.price_monthly ? `${Number(k.price_monthly).toLocaleString('ru-RU')} so'm/oy` : 'Narx kelishiladi'}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      ) : null}

      {c.branches.length ? (
        <>
          <div className="sec"><h2>Filiallar ({c.branches.length})</h2><i /></div>
          <div className="bwrap">
            <div className="bmap"><MapView points={points} zoom={14} /></div>
            <div className="blist">
              {c.branches.map((b) => {
                const r = regionById(b.region_id);
                return (
                  <div key={b.id} className="card branch">
                    <b><Icon name="pin" />{r && !String(b.address).toLowerCase().includes(r.short.slice(0, 5).toLowerCase()) ? r.short + ', ' : ''}{b.address}</b>
                    {b.phone ? <a className="ok" href={tel(b.phone)}>{b.phone}</a> : null}
                    <div className="row">
                      {b.lat != null ? <a className="btn ghost sm" href={`https://yandex.uz/maps/?rtext=~${b.lat}%2C${b.lng}&rtt=auto`} {...ext}><Icon name="route" />Yo'l ko'rsatish</a> : null}
                      {b.phone || c.phone ? <a className="btn sm" href={tel(b.phone || c.phone)}><Icon name="phone" />Qo'ng'iroq</a> : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : null}

      <div className="sec" id="ariza"><h2>O'qishga ariza berish</h2><i /></div>
      <section className="card lead-card" id="ariza-forma">
        <ApplyForm centerId={c.id} centerName={c.name} courses={courseOpts} />
      </section>

      <div className="sec" id="sharhlar"><h2>Sharhlar{reviews.length ? ` (${reviews.length})` : ''}</h2><i /></div>
      <div className="layout2 rev2">
        <section className="card">
          {reviews.length ? (
            <>
              <div className="revsum"><span className="big">{revAvg.toFixed(1)}</span><div><Stars value={revAvg} /><div className="muted" style={{ fontSize: 13 }}>{`${reviews.length} ta sharh asosida`}</div></div></div>
              {reviews.map((r) => (
                <div key={r.id} className="rev">
                  <div className="rh2"><b>{r.name}</b><small>{fmtDate(r.created_at)}</small></div>
                  <Stars value={r.stars} />
                  {r.comment ? <p style={{ marginTop: 6 }}>{r.comment}</p> : null}
                </div>
              ))}
            </>
          ) : (
            <p className="muted">Hali sharh qoldirilmagan. Shu markazda o'qigan bo'lsangiz, birinchi bo'lib fikringizni yozing.</p>
          )}
        </section>
        <section className="card">
          <h3 style={{ marginBottom: 10 }}>Sharh qoldirish</h3>
          <ReviewForm centerId={c.id} />
        </section>
      </div>

      {related.length ? (
        <>
          <div className="sec"><h2>O'xshash markazlar</h2><i />{region && slugs[0] && CAT_URL[slugs[0]] ? <Link href={`/markazlar/${region.slug}/${CAT_URL[slugs[0]]}`}>Barchasi <Icon name="arrow" /></Link> : null}</div>
          <div className="ccards">{related.map((x, i) => <CenterTile key={x.id} c={x} i={i} />)}</div>
        </>
      ) : null}

      <StickyCta phone={c.phone || ''} telegram={c.telegram || ''} name={c.name} />
    </div>
  );
}
