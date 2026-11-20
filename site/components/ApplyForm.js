'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { useMe, validPhone, rpcMsg, fmtSum } from '../lib/auth';
import { getSource } from '../lib/utm';

// O'qishga ariza: ro'yxatdan o'tish shart emas — ism va telefon yetarli.
// Ariza markaz paneliga va bosh admin paneliga tushadi. Kabinetga kirgan foydalanuvchi holatini kabinetda kuzatadi.
export default function ApplyForm({ centerId, centerName, courses = [] }) {
  const me = useMe();
  const [f, setF] = useState({ name: '', phone: '+998 ', course: courses[0]?.id || '', note: '', consent: false });
  const [st, setSt] = useState({ busy: false, ok: null, err: '' });
  const formRef = useRef(null);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const fail = (err) => setSt({ busy: false, ok: null, err });

  useEffect(() => {
    if (!me) return;
    setF((x) => ({ ...x, name: x.name || me.full_name || '', phone: x.phone.replace(/\D/g, '').length > 3 ? x.phone : (me.phone || x.phone) }));
  }, [me]);

  // Kurslar ro'yxatidagi "Ariza berish" tugmasi shu formani kerakli kurs bilan ochadi
  useEffect(() => {
    const on = (e) => {
      const d = e.detail || {};
      if (d.center && d.center !== centerId) return;
      setF((x) => ({
        ...x,
        course: d.course && courses.some((k) => k.id === d.course) ? d.course : x.course,
        note: x.note
      }));
      setSt((s) => (s.ok ? s : { ...s, err: '' }));
      setTimeout(() => { const el = formRef.current?.querySelector('input'); if (el) el.focus({ preventScroll: true }); }, 350);
    };
    window.addEventListener('es-ask', on);
    return () => window.removeEventListener('es-ask', on);
  }, [centerId, courses]);

  async function send(e) {
    e.preventDefault();
    const name = f.name.trim(), phone = f.phone.trim();
    if (name.length < 2) return fail('Ism familiyangizni kiriting.');
    if (!validPhone(phone)) return fail("Telefon raqamini to'liq kiriting, masalan: +998 90 123 45 67");
    if (!f.consent) return fail("Ma'lumotlaringiz markazga yuborilishiga rozilik bering.");
    setSt({ busy: true, ok: null, err: '' });
    const { data, error } = await supabase.rpc('submit_application', {
      p_center: centerId, p_course: f.course || null, p_name: name, p_phone: phone, p_note: f.note.trim() || null,
      p_source: getSource(), p_consent: true
    });
    if (error) return fail(rpcMsg(error, "Ariza yuborilmadi. Birozdan so'ng qayta urinib ko'ring."));
    setSt({ busy: false, ok: { code: data?.code || '' }, err: '' });
  }

  if (st.ok) {
    return (
      <div className="formmsg ok" role="status">
        <b>Rahmat! Arizangiz «{centerName}» markaziga yuborildi.</b> Markaz siz bilan telefon orqali bog'lanadi.
        {st.ok.code ? <> Ariza raqamingiz: <b className="appcode">{st.ok.code}</b> — markazga borganingizda shu raqamni ayting.</> : null}
        {me ? (
          <> Ariza holatini <Link href="/kabinet" style={{ textDecoration: 'underline' }}>shaxsiy kabinetingizda</Link> kuzatishingiz mumkin.</>
        ) : (
          <> Holatini kuzatmoqchi bo'lsangiz, <Link href="/kirish" style={{ textDecoration: 'underline' }}>kabinet oching</Link>.</>
        )}
      </div>
    );
  }

  return (
    <form className="lf" onSubmit={send} noValidate ref={formRef}>
      <p className="muted" style={{ marginBottom: 12 }}>
        Ro'yxatdan o'tish shart emas: ism va telefon raqamingizni qoldiring. Arizangiz to'g'ridan-to'g'ri markazga boradi, markaz siz bilan bog'lanib narx, dars jadvali va bo'sh joylar haqida aytib beradi.
      </p>
      <div className="fgrid2">
        <label>Ism familiya<input value={f.name} onChange={set('name')} maxLength={80} autoComplete="name" placeholder="Ism familiya" /></label>
        <label>Telefon raqam<input value={f.phone} onChange={set('phone')} maxLength={20} inputMode="tel" autoComplete="tel" placeholder="+998 90 123 45 67" /></label>
        {courses.length ? (
          <label className="full">Qaysi kurs
            <select value={f.course} onChange={set('course')}>
              {courses.map((k) => <option key={k.id} value={k.id}>{k.name}{k.price ? ` — ${fmtSum(k.price)}/oy` : ''}</option>)}
              <option value="">Hali aniq emas</option>
            </select>
          </label>
        ) : null}
        <label className="full">Izoh (ixtiyoriy)<textarea value={f.note} onChange={set('note')} maxLength={500} placeholder="Masalan: farzandim uchun, kechki guruh kerak" /></label>
      </div>
      <label className="consent">
        <input type="checkbox" checked={f.consent} onChange={set('consent')} />
        <span>Ismim va telefon raqamim shu ariza bo'yicha bog'lanish uchun «{centerName}» markaziga yuborilishiga roziman.</span>
      </label>
      <button className="btn" disabled={st.busy}>{st.busy ? 'Yuborilmoqda...' : 'Ariza yuborish'}</button>
      {st.err ? <div className="formmsg err" role="alert">{st.err}</div> : null}
      <p className="hint">Ma'lumotlaringiz faqat shu markazga ko'rsatiladi va boshqa maqsadda ishlatilmaydi.</p>
    </form>
  );
}
