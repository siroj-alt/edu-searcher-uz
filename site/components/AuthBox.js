'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMe, refreshMe, signIn, signUp, signOut, homeFor, normLogin, LOGIN_RE, validPhone } from '../lib/auth';

// Kirish va ro'yxatdan o'tish (login + parol)
export default function AuthBox({ next = '' }) {
  const router = useRouter();
  const me = useMe();
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ login: '', password: '', full_name: '', phone: '+998 ' });
  const [show, setShow] = useState(false);
  const [st, setSt] = useState({ busy: false, err: '' });
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const fail = (err) => setSt({ busy: false, err });
  const dest = (m) => (next && next.startsWith('/') && !next.startsWith('//') ? next : homeFor(m));

  async function submit(e) {
    e.preventDefault();
    const reg = mode === 'register';
    const login = (f.login.trim() || (reg ? f.phone : '')).trim();
    if (reg && f.full_name.trim().length < 2) return fail('Ism familiyangizni kiriting.');
    if (reg && !validPhone(f.phone)) return fail("Telefon raqamini to'liq kiriting, masalan: +998 90 123 45 67");
    if (!login) return fail('Loginni kiriting.');
    if (reg && !LOGIN_RE.test(normLogin(login))) return fail("Login 3–30 ta lotin harfi yoki raqamdan iborat bo'lsin. Bo'sh qoldirsangiz, telefon raqamingiz login bo'ladi.");
    if (f.password.length < 6) return fail("Parol kamida 6 belgidan iborat bo'lsin.");
    setSt({ busy: true, err: '' });
    const err = reg
      ? await signUp({ login, password: f.password, full_name: f.full_name.trim(), phone: f.phone.trim() })
      : await signIn(login, f.password);
    if (err) return fail(err);
    const m = await refreshMe();
    router.replace(dest(m));
  }

  if (me) {
    return (
      <div className="auth">
        <div className="card stack" style={{ textAlign: 'center' }}>
          <b>Siz kabinetga kirgansiz{me.full_name ? `, ${me.full_name}` : ''}.</b>
          <Link className="btn" href={dest(me)}>Kabinetga o'tish</Link>
          <button type="button" className="btn ghost" onClick={() => signOut()}>Chiqish</button>
        </div>
      </div>
    );
  }

  const reg = mode === 'register';
  return (
    <div className="auth">
      <h1 className="h1s" style={{ textAlign: 'center', marginBottom: 6 }}>{reg ? "Ro'yxatdan o'tish" : 'Kabinetga kirish'}</h1>
      <p className="muted" style={{ textAlign: 'center', marginBottom: 18 }}>
        {reg ? "Kabinet oching: markazlarni saqlang, o'qishga ariza bering va to'lovlaringizni kuzating." : "O'quvchilar va o'quv markazlari uchun yagona kirish."}
      </p>
      <div className="tabs" style={{ justifyContent: 'center' }}>
        <button type="button" className={'tab' + (!reg ? ' on' : '')} onClick={() => { setMode('login'); setSt({ busy: false, err: '' }); }}>Kirish</button>
        <button type="button" className={'tab' + (reg ? ' on' : '')} onClick={() => { setMode('register'); setSt({ busy: false, err: '' }); }}>Ro'yxatdan o'tish</button>
      </div>
      <form className="card stack" onSubmit={submit} noValidate>
        {reg ? (
          <>
            <label>Ism familiya<input value={f.full_name} onChange={set('full_name')} maxLength={80} autoComplete="name" placeholder="Masalan: Aziz Karimov" /></label>
            <label>Telefon raqam<input value={f.phone} onChange={set('phone')} maxLength={20} inputMode="tel" autoComplete="tel" placeholder="+998 90 123 45 67" /></label>
          </>
        ) : null}
        <label>{reg ? 'Login (ixtiyoriy)' : 'Login yoki telefon raqam'}
          <input value={f.login} onChange={set('login')} maxLength={60} autoCapitalize="none" autoCorrect="off" autoComplete="username"
            placeholder={reg ? "Bo'sh qoldirsangiz, telefon raqamingiz login bo'ladi" : 'Masalan: 998901234567'} />
        </label>
        <label>Parol{reg ? ' (kamida 6 belgi)' : ''}
          <input value={f.password} onChange={set('password')} type={show ? 'text' : 'password'} maxLength={72} autoComplete={reg ? 'new-password' : 'current-password'} />
        </label>
        <label className="chk"><input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} /> Parolni ko'rsatish</label>
        <button className="btn" disabled={st.busy}>{st.busy ? 'Kutib turing...' : reg ? "Ro'yxatdan o'tish" : 'Kirish'}</button>
        {st.err ? <div className="formmsg err" role="alert">{st.err}</div> : null}
        {!reg ? <p className="muted" style={{ fontSize: 13 }}>Parolni unutgan bo'lsangiz, sayt ma'muriyatiga murojaat qiling: parolingiz yangilab beriladi.</p> : null}
      </form>
    </div>
  );
}
