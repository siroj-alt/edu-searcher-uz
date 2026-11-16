import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { LEVELS } from '../../lib/levels';
import { colorFor, initials, tel } from '../../lib/cats';
import { regionById } from '../../lib/regions';
import { slugsOf, catNamesOf, regionIdsOf } from '../../lib/points';
import { UUID_RE } from '../../lib/seo';
import CompareEmpty, { CompareRemove } from '../../components/CompareClient';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Markazlarni taqqoslash | EduSearcher',
  description: "O'quv markazlarini narx, daraja, filiallar va baho bo'yicha yonma-yon solishtiring.",
  robots: { index: false, follow: true }
};

const FIELDS = 'id,name,rating,phone,telegram,is_verified,cover_url,branches(id,region_id),courses(level,price_monthly,duration_months,categories(slug,name))';
const LVL = ['beginner', 'intermediate', 'advanced'];
const sum = (n) => Number(n).toLocaleString('ru-RU') + " so'm";
const tgHref = (t) => (/^https?:/i.test(t) ? t : 'https://t.me/' + String(t).replace(/^@/, ''));

export default async function Compare({ searchParams }) {
  const ids = String(searchParams?.ids || '').split(',').map((s) => s.trim()).filter((s) => UUID_RE.test(s)).slice(0, 3);
  if (!ids.length) return <div className="wrap page"><CompareEmpty /></div>;

  const [{ data }, { data: revs }] = await Promise.all([
    supabase.from('centers').select(FIELDS).in('id', ids),
    supabase.from('center_reviews').select('center_id,stars').in('center_id', ids).eq('status', 'approved')
  ]);
  const byId = Object.fromEntries((data || []).map((c) => [c.id, { ...c, branches: c.branches || [], courses: c.courses || [] }]));
  const list = ids.map((id) => byId[id]).filter(Boolean);
  if (!list.length) return <div className="wrap page"><CompareEmpty /></div>;

  const cols = list.map((c) => {
    const rv = (revs || []).filter((r) => r.center_id === c.id);
    const prices = c.courses.map((k) => Number(k.price_monthly)).filter((p) => p > 0);
    const levels = LVL.filter((l) => c.courses.some((k) => k.level === l));
    const durs = c.courses.map((k) => Number(k.duration_months)).filter((d) => d > 0);
    const regions = regionIdsOf(c).map((id) => regionById(id)?.short).filter(Boolean);
    const rating = rv.length ? rv.reduce((s, r) => s + r.stars, 0) / rv.length : Number(c.rating) || 0;
    return {
      c, rv: rv.length, rating, levels, regions,
      min: prices.length ? Math.min(...prices) : null,
      max: prices.length ? Math.max(...prices) : null,
      dur: durs.length ? Math.min(...durs) : null,
      cats: catNamesOf(c), color: colorFor(slugsOf(c)[0])
    };
  });

  // Har bir qatorda eng yaxshi qiymat belgilanadi
  const bestOf = (vals, dir) => {
    const ok = vals.filter((v) => v != null && v !== 0);
    if (ok.length < 2) return null;
    const b = dir === 'min' ? Math.min(...ok) : Math.max(...ok);
    return ok.filter((v) => v === b).length === ok.length ? null : b;
  };
  const rows = [
    { label: 'Narx / oy', vals: cols.map((x) => x.min), best: bestOf(cols.map((x) => x.min), 'min'),
      show: (x) => (x.min ? (x.min === x.max ? sum(x.min) : `${sum(x.min)} dan`) : 'Kelishiladi') },
    { label: 'Darajalar', vals: cols.map((x) => x.levels.length), best: bestOf(cols.map((x) => x.levels.length), 'max'),
      show: (x) => (x.levels.length ? x.levels.map((l) => LEVELS[l]).join(', ') : '—') },
    { label: "Yo'nalishlar", vals: cols.map((x) => x.cats.length), best: bestOf(cols.map((x) => x.cats.length), 'max'),
      show: (x) => (x.cats.length ? x.cats.slice(0, 3).join(', ') + (x.cats.length > 3 ? ` +${x.cats.length - 3}` : '') : '—') },
    { label: 'Filiallar', vals: cols.map((x) => x.c.branches.length), best: bestOf(cols.map((x) => x.c.branches.length), 'max'),
      show: (x) => `${x.c.branches.length} ta` },
    { label: 'Hudud', vals: cols.map(() => null), best: null, show: (x) => (x.regions.length > 2 ? `${x.regions.length} ta viloyat` : x.regions.join(', ') || '—') },
    { label: 'Baho', vals: cols.map((x) => (x.rating ? Number(x.rating.toFixed(1)) : null)), best: bestOf(cols.map((x) => (x.rating ? Number(x.rating.toFixed(1)) : null)), 'max'),
      show: (x) => (x.rating ? `${x.rating.toFixed(1)}${x.rv ? ` (${x.rv})` : ''}` : 'Hali yo\'q') },
    { label: 'Kurs muddati', vals: cols.map((x) => x.dur), best: null, show: (x) => (x.dur ? `${x.dur} oydan` : '—') },
    { label: 'Tasdiqlangan', vals: cols.map((x) => (x.c.is_verified ? 1 : 0)), best: bestOf(cols.map((x) => (x.c.is_verified ? 1 : 0)), 'max'),
      show: (x) => (x.c.is_verified ? 'Ha' : "Yo'q") }
  ];

  return (
    <div className="wrap page cmppage">
      <div className="cmphead">
        <h1 className="h1s">Markazlarni taqqoslash</h1>
        <p className="muted">Har bir qatorda eng yaxshi qiymat yashil bilan belgilangan.</p>
      </div>
      <div className="cmpscroll">
        <div className="cmptable" style={{ '--n': cols.length }}>
          <div className="cmpcell lbl" />
          {cols.map((x) => (
            <div key={x.c.id} className="cmpcell hd">
              <CompareRemove id={x.c.id} ids={ids} />
              <Link href={`/centers/${x.c.id}`} className="cmpav" style={{ background: x.color }}>
                {x.c.cover_url ? <img src={x.c.cover_url} alt="" loading="lazy" /> : initials(x.c.name)}
              </Link>
              <Link href={`/centers/${x.c.id}`} className="cmpname">{x.c.name}</Link>
            </div>
          ))}
          {rows.map((r) => (
            <div key={r.label} className="cmprow" style={{ display: 'contents' }}>
              <div className="cmpcell lbl">{r.label}</div>
              {cols.map((x, i) => {
                const best = r.best != null && r.vals[i] === r.best;
                return (
                  <div key={x.c.id} className={'cmpcell' + (best ? ' best' : '')}>
                    {best ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-label="Eng yaxshi"><path d="M5 12l5 5 9-10" /></svg> : null}
                    {r.show(x)}
                  </div>
                );
              })}
            </div>
          ))}
          <div className="cmpcell lbl" />
          {cols.map((x) => (
            <div key={x.c.id} className="cmpcell acts">
              <Link className="btn" href={`/centers/${x.c.id}#ariza`}>Ariza</Link>
              {x.c.phone ? <a className="btn ghost" href={tel(x.c.phone)}>Qo'ng'iroq</a>
                : x.c.telegram ? <a className="btn ghost" href={tgHref(x.c.telegram)} target="_blank" rel="noopener noreferrer">Telegram</a> : null}
            </div>
          ))}
        </div>
      </div>
      {cols.length < 3 ? (
        <p className="muted cmpmore">Yana markaz qo'shish uchun <Link href="/search" className="ok">markazlar ro'yxatida</Link> «Taqqoslash» tugmasini bosing.</p>
      ) : null}
    </div>
  );
}
