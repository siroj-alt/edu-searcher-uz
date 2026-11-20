'use client';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { rpcMsg } from '../../lib/auth';
import { REGIONS } from '../../lib/regions';

const PAGE = 30;
const LEVEL = { beginner: "Boshlang'ich", intermediate: "O'rta", advanced: 'Yuqori' };
const digits = (v) => String(v || '').replace(/\D/g, '');
const tgLink = (t) => {
  const s = String(t || '').trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  return 'https://t.me/' + s.replace(/^@/, '').replace(/^t\.me\//i, '');
};

// Bosh admin: narxi kiritilmagan kurslar ro'yxati. Narx kiritilganda kurs darhol yangilanadi.
export default function PriceTodo() {
  const [cats, setCats] = useState([]);
  const [region, setRegion] = useState('');
  const [cat, setCat] = useState('');
  const [q, setQ] = useState('');
  const [qd, setQd] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [vals, setVals] = useState({});
  const [busy, setBusy] = useState({});
  const [done, setDone] = useState({});

  useEffect(() => { supabase.from('categories').select('id,name').order('name').then(({ data: d }) => setCats(d || [])); }, []);
  useEffect(() => { const t = setTimeout(() => { setQd(q); setPage(0); }, 350); return () => clearTimeout(t); }, [q]);

  const load = useCallback(async () => {
    setErr('');
    const { data: d, error } = await supabase.rpc('admin_price_todo', {
      p_region: region ? Number(region) : null, p_category: cat ? Number(cat) : null, p_q: qd || null, p_limit: PAGE, p_offset: page * PAGE
    });
    if (error) { setErr(rpcMsg(error, "Ro'yxatni yuklab bo'lmadi.")); setData({ total: 0, items: [] }); return; }
    setData(d || { total: 0, items: [] });
  }, [region, cat, qd, page]);
  useEffect(() => { setData(null); load(); }, [load]);

  async function save(courseId) {
    const n = Number(digits(vals[courseId]));
    if (!n || n < 10000 || n > 50000000) { setErr("Narxni so'mda kiriting: 10 000 dan 50 000 000 gacha."); return; }
    setBusy((b) => ({ ...b, [courseId]: true })); setErr('');
    const { error } = await supabase.from('courses').update({ price_monthly: n }).eq('id', courseId);
    setBusy((b) => ({ ...b, [courseId]: false }));
    if (error) { setErr(rpcMsg(error, "Narxni saqlab bo'lmadi.")); return; }
    setDone((d) => ({ ...d, [courseId]: n }));
  }

  const total = data?.total || 0;
  const pages = Math.max(1, Math.ceil(total / PAGE));
  return (
    <>
      <div className="ptodo-f">
        <select value={region} onChange={(e) => { setRegion(e.target.value); setPage(0); }} aria-label="Viloyat">
          <option value="">Barcha viloyatlar</option>
          {REGIONS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <select value={cat} onChange={(e) => { setCat(e.target.value); setPage(0); }} aria-label="Yo'nalish">
          <option value="">Barcha yo'nalishlar</option>
          {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Markaz nomi" aria-label="Markaz nomi bo'yicha qidirish" />
      </div>
      {err ? <div className="formmsg err" style={{ margin: '10px 0' }} role="alert">{err}</div> : null}
      {!data ? <div className="card muted">Yuklanmoqda...</div> : (
        <>
          <p className="muted" style={{ margin: '10px 0' }}>{total ? `Narxi to'liq kiritilmagan markazlar: ${total} ta` : "Tanlangan filtr bo'yicha narxi kiritilmagan kurs qolmadi."}</p>
          <div className="ptodo-list">
            {(data.items || []).map((c) => {
              const tg = tgLink(c.telegram);
              return (
                <section key={c.id} className="card ptodo-c">
                  <header>
                    <div>
                      <a href={`/centers/${c.id}`} target="_blank" rel="noreferrer"><b>{c.name}</b></a>
                      <small className="muted">{`${c.missing} ta kursda narx yo'q · ${c.priced} ta kursda bor`}</small>
                    </div>
                    <div className="ptodo-a">
                      {c.phone ? <a className="btn ghost sm" href={`tel:${c.phone.replace(/[^\d+]/g, '')}`}>{c.phone}</a> : null}
                      {tg ? <a className="btn ghost sm" href={tg} target="_blank" rel="noreferrer">Telegram</a> : null}
                    </div>
                  </header>
                  <ul>
                    {(c.courses || []).map((k) => (
                      <li key={k.id}>
                        <span>{k.name || k.category}<small className="muted">{` · ${k.category}${LEVEL[k.level] ? ' · ' + LEVEL[k.level] : ''}`}</small></span>
                        {done[k.id] ? <em className="ptodo-ok">{`${done[k.id].toLocaleString('ru-RU')} so'm saqlandi`}</em> : (
                          <form onSubmit={(e) => { e.preventDefault(); save(k.id); }}>
                            <input inputMode="numeric" placeholder="Oylik narx, so'm" value={vals[k.id] || ''} aria-label={`${k.name || k.category} oylik narxi`}
                              onChange={(e) => { const d = digits(e.target.value).slice(0, 8); setVals((v) => ({ ...v, [k.id]: d ? Number(d).toLocaleString('ru-RU') : '' })); }} />
                            <button type="submit" className="btn sm" disabled={busy[k.id] || !vals[k.id]}>{busy[k.id] ? '...' : 'Saqlash'}</button>
                          </form>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
          {pages > 1 ? (
            <div className="row" style={{ justifyContent: 'center', gap: 10, marginTop: 14 }}>
              <button type="button" className="btn ghost sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Oldingi</button>
              <span className="muted">{`${page + 1} / ${pages}`}</span>
              <button type="button" className="btn ghost sm" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>Keyingi</button>
            </div>
          ) : null}
        </>
      )}
    </>
  );
}
