'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { useMe, rpcMsg, validPhone, signOut } from '../lib/auth';
import { REGIONS } from '../lib/regions';
import { SECTIONS } from '../lib/sections';
import AuthBox from './AuthBox';

const STATUS = { pending: "Ko'rib chiqilmoqda", approved: 'Tasdiqlangan', rejected: 'Rad etilgan' };
const fmtDate = (d) => new Date(d).toLocaleDateString('ru-RU');

// Markazlar uchun ro'yxatdan o'tish: kabinetga kiring → markaz ma'lumotlarini yuboring → admin tasdiqlaydi
export default function CenterSignup() {
  const me = useMe();
  const [req, setReq] = useState(undefined);
  const [again, setAgain] = useState(false);

  useEffect(() => {
    if (!me || me.role !== 'user') { setReq(null); return; }
    supabase.from('center_requests').select('id,center_name,status,admin_note,created_at,decided_at').eq('user_id', me.id).order('created_at', { ascending: false }).limit(1)
      .then(({ data }) => setReq(data?.[0] || null));
  }, [me]);

  const intro = (
    <div className="csu-intro">
      <h1 className="h1s">O'quv markazingizni qo'shing</h1>
      <p className="muted">Bepul. Markazingiz qidiruvda va xaritada chiqadi, arizalar to'g'ridan-to'g'ri kabinetingizga tushadi.</p>
      <ol className="csu-steps">
        <li><b>Kabinetga kiring</b><span>Google, Apple yoki login va parol bilan.</span></li>
        <li><b>Markaz ma'lumotlarini yuboring</b><span>Nomi, manzili, telefoni va yo'nalishlari.</span></li>
        <li><b>Tasdiqlashni kuting</b><span>Ma'muriyat tekshirgach, markaz kabineti ochiladi.</span></li>
      </ol>
    </div>
  );

  if (me === undefined || (me && me.role === 'user' && req === undefined)) {
    return <div className="csu">{intro}<div className="card"><div className="sk sk-t" /><div className="sk sk-s" style={{ marginTop: 10 }} /></div></div>;
  }
  if (!me) {
    return (
      <div className="csu">
        {intro}
        <AuthBox next="/markaz-royxat" defaultMode="register" title="1-qadam: kabinetga kiring" subtitle="Hisobingiz bo'lsa, «Kirish»ni tanlang. Keyingi qadamda markaz ma'lumotlarini kiritasiz." />
      </div>
    );
  }
  if (me.role === 'center_owner') {
    return (
      <div className="csu">{intro}
        <div className="card stack csu-done">
          <b>Sizda markaz kabineti bor.</b>
          <p className="muted">Arizalar, o'quvchilar va markaz ma'lumotlari kabinetingizda.</p>
          <Link className="btn" href="/markaz-kabineti">Markaz kabinetiga o'tish</Link>
        </div>
      </div>
    );
  }
  if (me.role === 'admin') {
    return <div className="csu">{intro}<div className="card stack"><b>Siz administratorsiz.</b><p className="muted">Markazlar so'rovlari admin panelda ko'rib chiqiladi.</p></div></div>;
  }
  if (req && req.status === 'pending') {
    return (
      <div className="csu">{intro}
        <div className="card stack csu-done">
          <span className="csu-badge wait">{STATUS.pending}</span>
          <b>«{req.center_name}» so'rovi yuborilgan ({fmtDate(req.created_at)}).</b>
          <p className="muted">Ma'muriyat ma'lumotlarni tekshirib, siz bilan telefon orqali bog'lanadi. Tasdiqlangach, shu kabinet orqali markaz paneliga kirasiz.</p>
          <Link className="btn ghost" href="/kabinet">Shaxsiy kabinetga qaytish</Link>
        </div>
      </div>
    );
  }
  if (req && req.status === 'approved' && !again) {
    return (
      <div className="csu">{intro}
        <div className="card stack csu-done">
          <span className="csu-badge ok">{STATUS.approved}</span>
          <b>Markazingiz tasdiqlandi.</b>
          <p className="muted">Markaz kabinetini ochish uchun chiqib, qayta kiring.</p>
          <button type="button" className="btn" onClick={async () => { await signOut(); window.location.href = '/kirish?next=/markaz-kabineti'; }}>Qayta kirish</button>
        </div>
      </div>
    );
  }
  return (
    <div className="csu">
      {intro}
      {req && req.status === 'rejected' && !again ? (
        <div className="card stack csu-done">
          <span className="csu-badge bad">{STATUS.rejected}</span>
          <b>«{req.center_name}» so'rovi rad etildi.</b>
          {req.admin_note ? <p>{req.admin_note}</p> : null}
          <button type="button" className="btn" onClick={() => setAgain(true)}>Yangi so'rov yuborish</button>
        </div>
      ) : <CenterForm me={me} onSent={(r) => { setReq(r); setAgain(false); }} />}
    </div>
  );
}

function CenterForm({ me, onSent }) {
  const [cats, setCats] = useState([]);
  const [dists, setDists] = useState([]);
  const [f, setF] = useState({ name: '', contact: me.full_name || '', phone: me.phone || '+998 ', telegram: '', region: '', district: '', address: '', note: '' });
  const [sel, setSel] = useState([]);
  const [pos, setPos] = useState(null);
  const [st, setSt] = useState({ busy: false, err: '' });
  const [existing, setExisting] = useState(null);
  const [found, setFound] = useState([]);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  useEffect(() => { supabase.from('categories').select('id,name,slug').order('id').then(({ data }) => setCats(data || [])); }, []);
  useEffect(() => {
    const r = REGIONS.find((x) => x.slug === f.region);
    if (!r) { setDists([]); return; }
    supabase.rpc('region_districts', { p_region: r.id }).then(({ data }) => setDists((data || []).slice().sort((a, b) => a.name.localeCompare(b.name))));
  }, [f.region]);
  // Saytda allaqachon bor markazni topish (shu markazning egasi ekanligingizni bildirish uchun)
  useEffect(() => {
    const q = f.name.trim();
    if (existing || q.length < 3) { setFound([]); return; }
    const t = setTimeout(() => {
      supabase.from('centers').select('id,name,owner_id').ilike('name', `%${q.replace(/[%_]/g, '')}%`).is('owner_id', null).limit(5).then(({ data }) => setFound(data || []));
    }, 350);
    return () => clearTimeout(t);
  }, [f.name, existing]);

  const groups = useMemo(() => {
    const used = new Set();
    const g = SECTIONS.map((s) => ({ s, list: s.cats.map((sl) => cats.find((c) => c.slug === sl)).filter((c) => c && !used.has(c.id) && used.add(c.id)) }));
    const rest = cats.filter((c) => !used.has(c.id));
    if (rest.length) g.push({ s: { slug: 'boshqa', name: 'Boshqa' }, list: rest });
    return g.filter((x) => x.list.length);
  }, [cats]);

  const toggle = (id) => setSel((l) => (l.includes(id) ? l.filter((x) => x !== id) : l.length >= 15 ? l : [...l, id]));
  const locate = () => {
    if (!navigator.geolocation) return setSt({ busy: false, err: "Brauzeringiz joylashuvni qo'llamaydi." });
    navigator.geolocation.getCurrentPosition(
      (p) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setSt({ busy: false, err: "Joylashuvga ruxsat berilmadi. Manzilni yozib qoldiring, ma'muriyat xaritaga joylaydi." }),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  async function submit(e) {
    e.preventDefault();
    const fail = (err) => setSt({ busy: false, err });
    if (f.name.trim().length < 2) return fail('Markaz nomini kiriting.');
    if (f.contact.trim().length < 2) return fail("Mas'ul shaxs ismini kiriting.");
    if (!validPhone(f.phone)) return fail("Telefon raqamini to'liq kiriting, masalan: +998 90 123 45 67");
    const r = REGIONS.find((x) => x.slug === f.region);
    if (!r) return fail('Viloyatni tanlang.');
    if (!sel.length) return fail("Kamida bitta yo'nalishni tanlang.");
    setSt({ busy: true, err: '' });
    const { data, error } = await supabase.rpc('submit_center_request', {
      p_center_name: f.name.trim(), p_contact_name: f.contact.trim(), p_phone: f.phone.trim(), p_telegram: f.telegram.trim() || null,
      p_region: r.id, p_district: f.district ? Number(f.district) : null, p_address: f.address.trim() || null,
      p_lat: pos?.lat ?? null, p_lng: pos?.lng ?? null, p_categories: sel, p_note: f.note.trim() || null, p_existing: existing?.id || null
    });
    if (error) return fail(rpcMsg(error, "So'rov yuborilmadi. Birozdan so'ng qayta urinib ko'ring."));
    onSent({ id: data, center_name: f.name.trim(), status: 'pending', created_at: new Date().toISOString() });
  }

  return (
    <form className="card stack csu-form" onSubmit={submit} noValidate>
      <h2 className="h2">2-qadam: markaz ma'lumotlari</h2>
      <label>Markaz nomi<input value={f.name} onChange={(e) => { set('name')(e); setExisting(null); }} maxLength={120} placeholder="Masalan: Bilim Akademiyasi" /></label>
      {existing ? (
        <div className="csu-exist">Saytdagi «<b>{existing.name}</b>» markazi sizniki deb belgilandi. <button type="button" className="linkbtn" onClick={() => setExisting(null)}>Bekor qilish</button></div>
      ) : found.length ? (
        <div className="csu-found">
          <small>Markazingiz saytda bormi? Tanlang — ma'lumotlari saqlanib, kabinet sizga ochiladi:</small>
          {found.map((c) => <button type="button" key={c.id} className="chipbtn" onClick={() => { setExisting(c); setFound([]); }}>{c.name}</button>)}
        </div>
      ) : null}
      <div className="two">
        <label>Mas'ul shaxs<input value={f.contact} onChange={set('contact')} maxLength={80} autoComplete="name" placeholder="Ism familiya" /></label>
        <label>Telefon<input value={f.phone} onChange={set('phone')} maxLength={20} inputMode="tel" autoComplete="tel" /></label>
      </div>
      <label>Telegram (ixtiyoriy)<input value={f.telegram} onChange={set('telegram')} maxLength={80} placeholder="@markaz_uz" autoCapitalize="none" /></label>
      <div className="two">
        <label>Viloyat
          <select value={f.region} onChange={(e) => setF((x) => ({ ...x, region: e.target.value, district: '' }))}>
            <option value="">Tanlang</option>
            {REGIONS.map((r) => <option key={r.slug} value={r.slug}>{r.name}</option>)}
          </select>
        </label>
        <label>Tuman yoki shahar
          <select value={f.district} onChange={set('district')} disabled={!dists.length}>
            <option value="">{f.region ? 'Tanlang' : 'Avval viloyatni tanlang'}</option>
            {dists.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </label>
      </div>
      <label>Manzil<input value={f.address} onChange={set('address')} maxLength={200} placeholder="Ko'cha, uy, mo'ljal" /></label>
      <button type="button" className={'btn ghost csu-loc' + (pos ? ' on' : '')} onClick={locate}>{pos ? 'Joylashuv belgilandi ✓' : 'Markaz joylashuvini aniqlash (markazda turgan bo\'lsangiz)'}</button>
      <fieldset className="csu-cats">
        <legend>Yo'nalishlar <small>{`${sel.length} ta tanlandi`}</small></legend>
        {groups.map((g) => (
          <div key={g.s.slug} className="csu-g">
            <small>{g.s.name}</small>
            <div className="fs-chips">
              {g.list.map((c) => <button type="button" key={c.id} className={sel.includes(c.id) ? 'on' : ''} aria-pressed={sel.includes(c.id)} onClick={() => toggle(c.id)}>{c.name}</button>)}
            </div>
          </div>
        ))}
      </fieldset>
      <label>Qo'shimcha ma'lumot (ixtiyoriy)<textarea value={f.note} onChange={set('note')} maxLength={1000} rows={3} placeholder="Narxlar, dars vaqtlari, filiallar soni" /></label>
      <button className="btn" disabled={st.busy}>{st.busy ? 'Yuborilmoqda…' : "So'rovni yuborish"}</button>
      {st.err ? <div className="formmsg err" role="alert">{st.err}</div> : null}
      <p className="muted" style={{ fontSize: 13 }}>So'rov yuborish orqali ma'lumotlar to'g'riligini tasdiqlaysiz. Kurslar narxi va jadvalini tasdiqlangandan so'ng kabinetda kiritasiz.</p>
    </form>
  );
}
