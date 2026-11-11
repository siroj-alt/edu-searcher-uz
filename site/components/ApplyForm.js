'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { useMe, refreshMe, signIn, signUp, validPhone, rpcMsg, fmtSum } from '../lib/auth';

// O'qishga ariza: markaz paneliga va bosh admin paneliga tushadi.
// Mehmon ariza bilan birga kabinet ochadi (login — telefon raqami), shunda ariza holatini kuzata oladi.
export default function ApplyForm({ centerId, centerName, courses = [] }) {
  const me = useMe();
  const [f, setF] = useState({ name: '', phone: '+998 ', course: courses[0]?.id || '', note: '', login: '', password: '' });
  const [has, setHas] = useState(false);
  const [st, setSt] = useState({ busy: false, ok: false, err: '' });
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const fail = (err) => setSt({ busy: false, ok: false, err });

  useEffect(() => {
    if (!me) return;
    setF((x) => ({ ...x, name: x.name || me.full_name || '', phone: x.phone.replace(/\D/g, '').length > 3 ? x.phone : (me.phone || x.phone) }));
  }, [me]);

  async function send(e) {
    e.preventDefault();
    const name = f.name.trim(), phone = f.phone.trim();
    const login = !me && has;
    if (!login && name.length < 2) return fail('Ism familiyangizni kiriting.');
    if (!login && !validPhone(phone)) return fail("Telefon raqamini to'liq kiriting, masalan: +998 90 123 45 67");
    if (login && !f.login.trim()) return fail('Login yoki telefon raqamingizni kiriting.');
    if (!me && f.password.length < 6) return fail(has ? 'Parolingizni kiriting.' : "Kabinet uchun parol o'ylab toping (kamida 6 belgi).");
    setSt({ busy: true, ok: false, err: '' });

    let user = me;
    if (!user) {
      const err = has ? await signIn(f.login, f.password) : await signUp({ login: phone, password: f.password, full_name: name, phone });
      if (err) return fail(!has && /band/.test(err) ? "Bu telefon raqam bilan kabinet ochilgan. «Kabinetim bor» ni tanlab, parolingiz bilan kiring." : err);
      user = await refreshMe();
      if (!user) return fail("Kabinetga kirib bo'lmadi. Qayta urinib ko'ring.");
    }
    const nm = name.length >= 2 ? name : (user.full_name || '').trim();
    const ph = validPhone(phone) ? phone : (user.phone || '').trim();
    if (nm.length < 2 || !validPhone(ph)) return fail('Ism familiya va telefon raqamingizni kiriting.');

    const { error } = await supabase.rpc('submit_application', {
      p_center: centerId, p_course: f.course || null, p_name: nm, p_phone: ph, p_note: f.note.trim() || null
    });
    if (error) return fail(rpcMsg(error, "Ariza yuborilmadi. Birozdan so'ng qayta urinib ko'ring."));
    setSt({ busy: false, ok: true, err: '' });
  }

  if (st.ok) {
    return (
      <div className="formmsg ok" role="status">
        Rahmat! Arizangiz «{centerName}» markaziga yuborildi. Markaz siz bilan bog'lanadi, ariza holatini{' '}
        <Link href="/kabinet" style={{ textDecoration: 'underline' }}>shaxsiy kabinetingizda</Link> kuzatishingiz mumkin.
      </div>
    );
  }

  const guest = !me;
  const showPerson = !(guest && has);
  return (
    <form className="lf" onSubmit={send} noValidate>
      <p className="muted" style={{ marginBottom: 12 }}>
        Arizangiz to'g'ridan-to'g'ri markazga yetib boradi. Markaz siz bilan bog'lanib, kursga qabul qilgach, kurs va oylik to'lovlar kabinetingizda paydo bo'ladi.
      </p>
      {guest ? (
        <div className="tabs" style={{ marginBottom: 12 }}>
          <button type="button" className={'tab' + (!has ? ' on' : '')} onClick={() => { setHas(false); fail(''); }}>Yangi kabinet ochaman</button>
          <button type="button" className={'tab' + (has ? ' on' : '')} onClick={() => { setHas(true); fail(''); }}>Kabinetim bor</button>
        </div>
      ) : null}
      <div className="fgrid2">
        {showPerson ? (
          <>
            <label>Ism familiya<input value={f.name} onChange={set('name')} maxLength={80} autoComplete="name" placeholder="Ism familiya" /></label>
            <label>Telefon raqam<input value={f.phone} onChange={set('phone')} maxLength={20} inputMode="tel" autoComplete="tel" placeholder="+998 90 123 45 67" /></label>
          </>
        ) : (
          <label className="full">Login yoki telefon raqam<input value={f.login} onChange={set('login')} maxLength={60} autoCapitalize="none" autoComplete="username" placeholder="Masalan: 998901234567" /></label>
        )}
        {guest ? (
          <label className="full">{has ? 'Parol' : "Kabinet uchun parol o'ylab toping (kamida 6 belgi)"}
            <input value={f.password} onChange={set('password')} type="password" maxLength={72} autoComplete={has ? 'current-password' : 'new-password'} />
          </label>
        ) : null}
        {courses.length ? (
          <label className="full">Qaysi kursga
            <select value={f.course} onChange={set('course')}>
              {courses.map((k) => <option key={k.id} value={k.id}>{k.name}{k.price ? ` — ${fmtSum(k.price)}/oy` : ''}</option>)}
              <option value="">Hali aniq emas</option>
            </select>
          </label>
        ) : null}
        <label className="full">Izoh (ixtiyoriy)<textarea value={f.note} onChange={set('note')} maxLength={500} placeholder="Masalan: farzandim uchun, kechki guruh kerak" /></label>
      </div>
      <button className="btn" disabled={st.busy}>{st.busy ? 'Yuborilmoqda...' : 'Ariza yuborish'}</button>
      {st.err ? <div className="formmsg err" role="alert">{st.err}</div> : null}
      <p className="hint">
        {guest && !has ? 'Login sifatida telefon raqamingiz ishlatiladi. ' : ''}Telefon raqamingiz faqat shu ariza bo'yicha bog'lanish uchun markazga ko'rsatiladi.
      </p>
    </form>
  );
}
