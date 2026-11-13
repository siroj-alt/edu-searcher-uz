import Link from 'next/link';
import HomeSearch from '../components/HomeSearch';
import CenterTile from '../components/CenterTile';
import { supabase } from '../lib/supabase';
import { CAT_COLORS, CAT_GLYPH } from '../lib/cats';
import { REGIONS } from '../lib/regions';

export const metadata = { alternates: { canonical: '/' } };

const STEPS = [
  ['Qidiring', "Kurs, viloyat va darajani tanlang yoki markaz nomini yozing."],
  ['Solishtiring', "Narx, filiallar, jadval va xaritadagi eng yaqin manzilni ko'ring."],
  ['Ariza bering', "Arizangiz markazga yetib boradi. Holatini shaxsiy kabinetda kuzatasiz."]
];
const ARROW = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></svg>;
const PINS = [[96, 104], [252, 96], [376, 200], [158, 196], [322, 152], [62, 300], [410, 70], [300, 250]];
const fmt = (n) => Number(n || 0).toLocaleString('ru-RU');

// Tavsiya etilgan 6 ta markaz: avval tavsiya belgilanganlar, so'ng har xil viloyatlardan reytingi yuqorilar
function pickTop(list) {
  const top = [], seen = new Set();
  const reg = (c) => c.branches[0]?.region_id;
  for (const c of list) if (c.is_featured && top.length < 6) { top.push(c); seen.add(reg(c)); }
  for (const c of list) { if (top.length >= 6) break; if (top.includes(c)) continue; if (!seen.has(reg(c))) { seen.add(reg(c)); top.push(c); } }
  for (const c of list) { if (top.length >= 6) break; if (!top.includes(c)) top.push(c); }
  return top;
}

function Cat({ c }) {
  return (
    <Link className="hcat" href={`/search?cat=${c.id}`} style={{ '--c': CAT_COLORS[c.slug] || '#0F7B55' }}>
      <span className="g">{CAT_GLYPH[c.slug] || c.name[0]}</span>
      <span><b>{c.name}</b><small>{fmt(c.n)} ta markaz</small></span>
    </Link>
  );
}

export default async function Home() {
  const { data } = await supabase.rpc('home_summary');
  const s = data || { centers: 0, branches: 0, courses: 0, cats: [], regions: {}, top: [] };
  const cats = (s.cats || []).filter((c) => c.n > 0).sort((a, b) => b.n - a.n);
  const regions = s.regions || {};
  const top = pickTop((s.top || []).map((c) => ({ ...c, branches: c.branches || [], courses: c.courses || [] })));
  const first = cats.slice(0, 8), rest = cats.slice(8);

  return (
    <>
      <section className="hero">
        <div className="hero-l">
          <span className="pill"><i aria-hidden="true" />{fmt(s.centers)} ta o'quv markazi · butun O'zbekiston bo'ylab</span>
          <h1>O'zingizga mos o'quv markazini <mark>bir daqiqada</mark> toping</h1>
          <p className="lead">Kurs, narx va manzil bo'yicha solishtiring, so'ng sayt orqali to'g'ridan-to'g'ri o'qishga ariza bering.</p>
          <HomeSearch cats={s.cats || []} />
          <div className="hpop">
            <span>Mashhur:</span>
            {cats.slice(0, 6).map((c) => <Link key={c.id} href={`/search?cat=${c.id}`}>{c.name}</Link>)}
          </div>
          <Link className="hfilter" href="/search">
            <span className="fi" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2.5" /><circle cx="10" cy="17" r="2.5" /></svg></span>
            <span className="ft"><b>Batafsil qidiruv</b><small>Daraja, narx va masofa bo'yicha tanlang</small></span>
            <span className="fa" aria-hidden="true">{ARROW}</span>
          </Link>
        </div>

        <Link className="hteaser" href="/xarita" aria-label={`Xaritani ochish: ${fmt(s.branches)} ta filial`}>
          <svg className="mapart" viewBox="0 0 480 440" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <rect className="base" width="480" height="440" />
            <path className="river" d="M-20 300 C 110 255 190 345 320 300 S 470 225 510 250" strokeWidth="46" fill="none" />
            <rect className="park" x="300" y="40" width="130" height="90" rx="14" />
            <rect className="park" x="30" y="250" width="90" height="70" rx="14" />
            <g className="road" strokeWidth="10" strokeLinecap="round" fill="none"><path d="M0 120H480" /><path d="M0 215H480" /><path d="M110 0V440" /><path d="M265 0V440" /><path d="M390 0V440" /></g>
            <g className="road2" strokeWidth="5" fill="none"><path d="M0 60H480" /><path d="M0 165L480 150" /><path d="M190 0L170 440" /><path d="M0 365H480" /><path d="M335 0L355 440" /></g>
          </svg>
          {PINS.map(([x, y]) => <span key={x + '-' + y} className="pin" style={{ left: `${(x / 480) * 100}%`, top: `${(y / 440) * 100}%` }} />)}
          <span className="pin me" style={{ left: '47%', top: '38%' }} />
          <span className="tok">
            <span className="ck"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span>
            <span><b>Sayt orqali ariza bering</b><small>Markaz siz bilan o'zi bog'lanadi</small></span>
          </span>
          <span className="tchip" style={{ top: 84, right: 18 }}><i />{fmt(s.branches)} filial xaritada</span>
          <span className="tcard">
            <span className="ti"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 4l6 2 5-2v14l-5 2-6-2-5 2V6z" /><path d="M9 4v14M15 6v14" /></svg></span>
            <span className="tt"><b>Eng yaqin markazni toping</b><small>Joylashuvingiz bo'yicha xaritada</small></span>
            <span className="tb">Xaritani ochish</span>
          </span>
        </Link>
      </section>

      <section className="hstrip" aria-label="Raqamlarda">
        <div>
          <div className="s"><b data-count={s.centers}>{fmt(s.centers)}</b><span>o'quv markazi</span></div>
          <div className="s"><b data-count={s.branches}>{fmt(s.branches)}</b><span>filial</span></div>
          <div className="s"><b data-count={s.courses}>{fmt(s.courses)}</b><span>kurs</span></div>
          <div className="s"><b data-count={cats.length}>{cats.length}</b><span>yo'nalish</span></div>
        </div>
      </section>

      <div className="wrap">
        <div className="hsec">
          <div><h2>Mashhur yo'nalishlar</h2><p>Eng ko'p markaz ochilgan yo'nalishlar, qolganini bir bosishda ko'ring.</p></div>
        </div>
        <div className="hcats">{first.map((c) => <Cat key={c.id} c={c} />)}</div>
        {rest.length ? (
          <details className="hall">
            <summary><span className="lbl-o">Barcha {cats.length} yo'nalish</span><span className="lbl-c">Yopish</span>{ARROW}</summary>
            <div className="hcats">{rest.map((c) => <Cat key={c.id} c={c} />)}</div>
          </details>
        ) : null}

        <div className="hsec">
          <div><h2>Tavsiya etilgan markazlar</h2><p>Tasdiqlangan markazlar, filiallar soni va oylik narx bir qarashda.</p></div>
          <Link href="/search">Barcha markazlar {ARROW}</Link>
        </div>
        <div className="ccards">{top.map((c, i) => <CenterTile key={c.id} c={c} i={i} />)}</div>

        <div className="hsec">
          <div><h2>Viloyatlar bo'yicha</h2><p>O'zingiz yashaydigan viloyatdagi markazlarni oching.</p></div>
          <Link href="/markazlar">Barchasi {ARROW}</Link>
        </div>
        <div className="rgns">
          {REGIONS.map((r, i) => (
            <Link key={r.slug} href={`/markazlar/${r.slug}`} className={'rgn' + (regions[r.id] ? '' : ' empty')} style={{ '--i': i }}>
              <span className="n" data-count={regions[r.id] || 0}>{regions[r.id] || 0}</span>
              <b>{r.name}</b>
              <small>o'quv markazi</small>
            </Link>
          ))}
        </div>
      </div>

      <section className="hhow">
        <div className="wrap">
          <div className="hsec"><h2>Qanday ishlaydi</h2></div>
          <div className="hsteps">
            {STEPS.map(([t, d], i) => <div key={t} className="hstep"><span className="n">{i + 1}</span><h3>{t}</h3><p>{d}</p></div>)}
          </div>
        </div>
      </section>

      <div className="wrap">
        <section className="hcta">
          <div>
            <h2>O'quv markazingiz bormi?</h2>
            <p>Markaz kabinetida arizalarni qabul qiling, o'quvchilar va oylik to'lovlarni bitta joyda boshqaring.</p>
          </div>
          <Link href="/markaz-kabineti">Markaz kabinetiga kirish</Link>
        </section>
      </div>
    </>
  );
}
