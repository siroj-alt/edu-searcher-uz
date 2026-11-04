'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { LEVELS } from '../../lib/levels';

export default function Panel() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [centers, setCenters] = useState([]);
  const [cats, setCats] = useState([]);
  const [sel, setSel] = useState('');
  const [detail, setDetail] = useState(null);
  const [msg, setMsg] = useState('');

  const loadCenters = useCallback(async (u, ro) => {
    let q = supabase.from('centers').select('id,name').order('name');
    if (ro !== 'admin') q = q.eq('owner_id', u.id);
    const { data } = await q;
    setCenters(data || []);
  }, []);

  const loadDetail = useCallback(async (id) => {
    const { data } = await supabase.from('centers')
      .select('id,name,contract_status,contract_end,branches(id,address,phone),courses(id,name,level,price_monthly,schedule)')
      .eq('id', id).single();
    setDetail(data);
  }, []);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/login');
      setUser(session.user);
      const { data: p } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
      const ro = p?.role || 'user';
      setRole(ro);
      const { data: cs } = await supabase.from('categories').select('id,name');
      setCats(cs || []);
      loadCenters(session.user, ro);
    })();
  }, [router, loadCenters]);

  useEffect(() => { if (sel) loadDetail(sel); else setDetail(null); }, [sel, loadDetail]);

  async function run(promise, okText, after) {
    const { error } = await promise;
    setMsg(error ? error.message : okText);
    if (!error && after) after();
  }
  const readForm = (e) => { const f = Object.fromEntries(new FormData(e.currentTarget)); e.currentTarget.reset(); return f; };

  function addCenter(e) {
    e.preventDefault(); const f = readForm(e);
    run(supabase.from('centers').insert({ name: f.name, description: f.description, telegram: f.telegram || null, website: f.website || null }),
      "Markaz qo'shildi", () => loadCenters(user, role));
  }
  function addBranch(e) {
    e.preventDefault(); const f = readForm(e);
    run(supabase.from('branches').insert({ center_id: sel, address: f.address, phone: f.phone || null, location: `SRID=4326;POINT(${f.lng} ${f.lat})` }),
      "Filial qo'shildi", () => loadDetail(sel));
  }
  function addCourse(e) {
    e.preventDefault(); const f = readForm(e);
    run(supabase.from('courses').insert({
      center_id: sel, category_id: +f.category_id, name: f.name, level: f.level,
      price_monthly: f.price ? +f.price : null, duration_months: f.months ? +f.months : null, schedule: f.schedule || null
    }), "Kurs qo'shildi", () => loadDetail(sel));
  }
  const del = (table, id) => run(supabase.from(table).delete().eq('id', id), "O'chirildi", () => loadDetail(sel));

  if (!role) return <div className="wrap page"><p className="muted">Yuklanmoqda...</p></div>;
  if (role === 'user') {
    return (
      <div className="wrap page"><div className="card">
        Sizda markazni boshqarish huquqi yo'q. Shartnoma tuzish uchun sayt administratori bilan bog'laning.
      </div></div>
    );
  }

  const canEdit = role === 'admin' || (detail?.contract_status === 'active' &&
    (!detail.contract_end || new Date(detail.contract_end) >= new Date(new Date().toDateString())));

  return (
    <div className="wrap page">
      <div className="row">
        <div className="sec" style={{ flex: 1 }}><h2>{role === 'admin' ? 'Admin panel' : 'Markaz kabineti'}</h2><i /></div>
        <button className="btn ghost sm" onClick={() => supabase.auth.signOut().then(() => router.push('/'))}>Chiqish</button>
      </div>
      {msg && <p className="ok">{msg}</p>}

      {role === 'admin' && (
        <form className="card stack" onSubmit={addCenter}>
          <b>Yangi markaz</b>
          <input name="name" placeholder="Markaz nomi" required />
          <textarea name="description" placeholder="Qisqacha tavsif" rows={2} />
          <input name="telegram" placeholder="Telegram havolasi" />
          <input name="website" placeholder="Veb-sayt" />
          <button className="btn sm">Markaz qo'shish</button>
        </form>
      )}

      <label style={{ margin: '14px 0' }}>Markazni tanlang
        <select value={sel} onChange={(e) => setSel(e.target.value)}>
          <option value="">Tanlang</option>
          {centers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      {centers.length === 0 && <p className="muted">Sizga biriktirilgan markaz yo'q.</p>}

      {detail && !canEdit && <div className="card err">Shartnoma faol emas yoki muddati tugagan. Tahrirlash yopiq.</div>}

      {detail && canEdit && (
        <div className="grid2">
          <form className="card stack" onSubmit={addBranch}>
            <b>Filial qo'shish</b>
            <input name="address" placeholder="Manzil" required />
            <input name="phone" placeholder="Telefon" />
            <input name="lat" placeholder="Kenglik (masalan 41.3111)" required />
            <input name="lng" placeholder="Uzunlik (masalan 69.2797)" required />
            <button className="btn sm">Filial qo'shish</button>
          </form>
          <form className="card stack" onSubmit={addCourse}>
            <b>Kurs qo'shish</b>
            <select name="category_id" required>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            <input name="name" placeholder="Kurs nomi" required />
            <select name="level">{Object.entries(LEVELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            <input name="price" type="number" placeholder="Oylik narx (so'm)" />
            <input name="months" type="number" placeholder="Davomiyligi (oy)" />
            <input name="schedule" placeholder="Jadval (Du-Chor-Ju 18:00)" />
            <button className="btn sm">Kurs qo'shish</button>
          </form>
        </div>
      )}

      {detail && (
        <>
          <div className="sec"><h2>Filiallar</h2><i /></div>
          {detail.branches.map((b) => (
            <div className="card row" key={b.id}><span>{b.address}</span>
              {canEdit && <button className="btn ghost sm" onClick={() => del('branches', b.id)}>O'chirish</button>}</div>
          ))}
          <div className="sec"><h2>Kurslar</h2><i /></div>
          {detail.courses.map((k) => (
            <div className="card row" key={k.id}><span>{k.name} · {LEVELS[k.level]}</span>
              {canEdit && <button className="btn ghost sm" onClick={() => del('courses', k.id)}>O'chirish</button>}</div>
          ))}
        </>
      )}
    </div>
  );
}
