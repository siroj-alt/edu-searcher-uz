'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { useMe, rpcMsg, validPhone } from '../../lib/auth';

const WD = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];
const WDF = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
const MON = ['yan', 'fev', 'mar', 'apr', 'may', 'iyun', 'iyul', 'avg', 'sen', 'okt', 'noy', 'dek'];
const MONF = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
const DEFAULT_TIMES = ['10:00', '14:00', '16:00', '18:00'];
const p2 = (n) => String(n).padStart(2, '0');

// Toshkent vaqti bo'yicha kunlar (brauzer boshqa vaqt mintaqasida bo'lsa ham)
function tashkentToday() {
  const now = new Date(Date.now() + 5 * 3600e3);
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

// ===== Bepul sinov darsiga yozilish =====
export function TrialBooking({ centerId, courses = [], slots = [] }) {
  const me = useMe();
  const days = useMemo(() => {
    const out = [];
    const base = tashkentToday();
    for (let i = 1; i <= 14 && out.length < 10; i++) {
      const d = new Date(base.getTime() + i * 864e5);
      const wd = d.getUTCDay();
      const iso = wd === 0 ? 7 : wd;
      const times = slots.length ? slots.filter((s) => s.weekday === iso).map((s) => String(s.at).slice(0, 5)) : (iso === 7 ? [] : DEFAULT_TIMES);
      if (times.length) out.push({ d, wd, times: [...new Set(times)].sort() });
    }
    return out;
  }, [slots]);
  const [day, setDay] = useState(0);
  const [time, setTime] = useState('');
  const [f, setF] = useState({ name: '', phone: '+998 ', course: '', consent: false });
  const [st, setSt] = useState({ busy: false, err: '', ok: null });
  useEffect(() => {
    if (me) setF((x) => ({ ...x, name: x.name || me.full_name || '', phone: x.phone.replace(/\D/g, '').length > 3 ? x.phone : (me.phone || x.phone) }));
  }, [me]);

  const sel = days[day];
  const dayTxt = (x) => `${WDF[x.wd]}, ${x.d.getUTCDate()}-${MONF[x.d.getUTCMonth()]}`;
  async function send(e) {
    e.preventDefault();
    if (!time) return setSt({ busy: false, err: 'Vaqtni tanlang.', ok: null });
    if (f.name.trim().length < 2) return setSt({ busy: false, err: 'Ism familiyani kiriting.', ok: null });
    if (!validPhone(f.phone)) return setSt({ busy: false, err: "Telefon raqamini to'liq kiriting, masalan: +998 90 123 45 67", ok: null });
    if (!f.consent) return setSt({ busy: false, err: "Ma'lumotlaringizni markazga yuborishga rozilik bering.", ok: null });
    const at = `${sel.d.getUTCFullYear()}-${p2(sel.d.getUTCMonth() + 1)}-${p2(sel.d.getUTCDate())}T${time}:00+05:00`;
    setSt({ busy: true, err: '', ok: null });
    const { data, error } = await supabase.rpc('book_trial', { p_center: centerId, p_course: f.course || null, p_name: f.name.trim(), p_phone: f.phone.trim(), p_at: at, p_consent: true });
    if (error) return setSt({ busy: false, err: rpcMsg(error, "Yozilib bo'lmadi. Qayta urinib ko'ring."), ok: null });
    setSt({ busy: false, err: '', ok: { code: data?.code || '', txt: `${dayTxt(sel)}, soat ${time}` } });
  }

  if (st.ok) {
    return (
      <div className="trial-ok">
        <b>Siz sinov darsiga yozildingiz: {st.ok.txt}.</b>
        {st.ok.code ? <p>Ariza raqami: <b>{st.ok.code}</b>. Markazga borganingizda shu raqamni ayting.</p> : null}
        <p className="muted">Markaz vaqtni tasdiqlash uchun qo'ng'iroq qiladi.{me ? <> Holatini <Link href="/kabinet">kabinetingizda</Link> kuzating.</> : null}</p>
      </div>
    );
  }
  if (!days.length) return <p className="muted">Markaz yaqin kunlar uchun sinov darsi vaqtlarini hali belgilamagan. Pastdagi forma orqali ariza qoldiring.</p>;
  return (
    <form className="trial stack" onSubmit={send} noValidate>
      <p className="muted">Kun va vaqtni tanlang — markaz bilan tanishib chiqasiz, darajangiz aniqlanadi. Bepul.</p>
      <b className="trial-l">Kun</b>
      <div className="trial-days" role="radiogroup" aria-label="Kun">
        {days.map((x, i) => (
          <button key={i} type="button" role="radio" aria-checked={day === i} className={day === i ? 'on' : ''} onClick={() => { setDay(i); if (!x.times.includes(time)) setTime(''); }}>
            <small>{WD[x.wd]}</small><b>{x.d.getUTCDate()}</b><small>{MON[x.d.getUTCMonth()]}</small>
          </button>
        ))}
      </div>
      <b className="trial-l">Vaqt</b>
      <div className="trial-times" role="radiogroup" aria-label="Vaqt">
        {sel.times.map((t) => <button key={t} type="button" role="radio" aria-checked={time === t} className={time === t ? 'on' : ''} onClick={() => setTime(t)}>{t}</button>)}
      </div>
      {courses.length ? (
        <label>Kurs (ixtiyoriy)
          <select value={f.course} onChange={(e) => setF({ ...f, course: e.target.value })}>
            <option value="">Kurs tanlanmagan</option>
            {courses.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
          </select>
        </label>
      ) : null}
      <div className="two">
        <label>Ism familiya<input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} maxLength={80} autoComplete="name" /></label>
        <label>Telefon raqam<input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} maxLength={20} inputMode="tel" autoComplete="tel" /></label>
      </div>
      <label className="chk"><input type="checkbox" checked={f.consent} onChange={(e) => setF({ ...f, consent: e.target.checked })} /> Ism va telefon raqamimni shu markazga yuborishga roziman</label>
      <button className="btn" disabled={st.busy}>{st.busy ? 'Yuborilmoqda...' : time ? `${dayTxt(sel)}, ${time} ga yozilish` : 'Sinov darsiga yozilish'}</button>
      {st.err ? <div className="formmsg err" role="alert">{st.err}</div> : null}
    </form>
  );
}

// ===== Natija qo'shish (shu markazda o'qiganlar uchun) =====
const EXAMS = ['IELTS', 'CEFR', 'SAT', 'TOEFL', 'Duolingo', 'DTM', 'Olimpiada', 'Boshqa'];
export function ResultForm({ centerId, centerName, onDone }) {
  const me = useMe();
  const [f, setF] = useState({ name: '', exam: 'IELTS', score: '', file: null });
  const [st, setSt] = useState({ busy: false, err: '', ok: false });
  useEffect(() => { if (me) setF((x) => ({ ...x, name: x.name || me.full_name || '' })); }, [me]);

  if (me === undefined) return <p className="muted">Yuklanmoqda...</p>;
  if (!me) return <p className="muted"><Link href={`/kirish?next=/centers/${centerId}`}>Kabinetga kiring</Link> — natija faqat shu markazda o'qigan o'quvchilardan qabul qilinadi.</p>;
  if (st.ok) return <div className="formmsg ok">Rahmat! Markaz tasdiqlagach natijangiz «Natijalar devori»da ko'rinadi.</div>;

  async function send(e) {
    e.preventDefault();
    if (f.name.trim().length < 2) return setSt({ busy: false, err: 'Ismingizni kiriting.', ok: false });
    if (!f.score.trim()) return setSt({ busy: false, err: 'Ballni kiriting (masalan, 7.5).', ok: false });
    if (f.file && f.file.size > 6 * 1024 * 1024) return setSt({ busy: false, err: "Rasm 6 MB dan oshmasin.", ok: false });
    setSt({ busy: true, err: '', ok: false });
    let url = null;
    if (f.file) {
      const ext = (f.file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'jpg';
      const path = `${me.id}/${Date.now()}.${ext}`;
      const up = await supabase.storage.from('results').upload(path, f.file, { contentType: f.file.type || 'image/jpeg', upsert: false });
      if (up.error) return setSt({ busy: false, err: "Rasm yuklanmadi. Rasmsiz yuboring yoki qayta urinib ko'ring.", ok: false });
      url = supabase.storage.from('results').getPublicUrl(path).data.publicUrl;
    }
    const { error } = await supabase.rpc('submit_result', { p_center: centerId, p_name: f.name.trim(), p_exam: f.exam, p_score: f.score.trim(), p_date: null, p_photo: url });
    if (error) return setSt({ busy: false, err: rpcMsg(error, 'Yuborilmadi.'), ok: false });
    setSt({ busy: false, err: '', ok: true });
    onDone?.();
  }
  return (
    <form className="stack" onSubmit={send} noValidate>
      <p className="muted" style={{ fontSize: 14 }}>{centerName ? `${centerName}da` : 'Shu markazda'} o'qib erishgan natijangiz. Markaz tekshirib tasdiqlaydi.</p>
      <label>Ism (devorda ko'rinadi)<input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} maxLength={60} /></label>
      <div className="stack" style={{ gap: 6 }}>
        <b style={{ fontSize: 14 }}>Imtihon</b>
        <div className="tags">{EXAMS.map((x) => <button key={x} type="button" className={'tag' + (f.exam === x ? ' on' : '')} onClick={() => setF({ ...f, exam: x })}>{x}</button>)}</div>
      </div>
      <label>Ball yoki daraja<input value={f.score} onChange={(e) => setF({ ...f, score: e.target.value })} maxLength={20} placeholder="7.5 / C1 / 1450" /></label>
      <label>Sertifikat rasmi (ixtiyoriy)<input type="file" accept="image/*" onChange={(e) => setF({ ...f, file: e.target.files?.[0] || null })} /></label>
      <button className="btn" disabled={st.busy}>{st.busy ? 'Yuborilmoqda...' : 'Natijani yuborish'}</button>
      {st.err ? <div className="formmsg err" role="alert">{st.err}</div> : null}
    </form>
  );
}

// Natijalar devori ostidagi "Natijamni qo'shish" tugmasi
export function ResultAdd({ centerId, centerName }) {
  const [open, setOpen] = useState(false);
  return open
    ? <section className="card" style={{ marginTop: 12 }}><h3 style={{ marginBottom: 10 }}>Natijamni qo'shish</h3><ResultForm centerId={centerId} centerName={centerName} /></section>
    : <button type="button" className="btn ghost sm" style={{ marginTop: 12 }} onClick={() => setOpen(true)}>Natijamni qo'shish</button>;
}
