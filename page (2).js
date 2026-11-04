'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function Login() {
  const router = useRouter();
  const [msg, setMsg] = useState('');

  async function submit(e, mode) {
    e.preventDefault();
    const form = e.currentTarget.form || e.currentTarget;
    const f = Object.fromEntries(new FormData(form));
    const { error } = mode === 'in'
      ? await supabase.auth.signInWithPassword({ email: f.email, password: f.password })
      : await supabase.auth.signUp({ email: f.email, password: f.password });
    if (error) return setMsg(error.message);
    if (mode === 'up') return setMsg("Ro'yxatdan o'tdingiz. Emailingizni tasdiqlang, so'ng kiring.");
    router.push('/panel');
  }

  return (
    <div className="wrap page" style={{ maxWidth: 440 }}>
      <div className="sec"><h2>Kirish</h2><i /></div>
      <form className="card stack" onSubmit={(e) => submit(e, 'in')}>
        <label>Email<input name="email" type="email" required /></label>
        <label>Parol<input name="password" type="password" minLength={6} required /></label>
        <button className="btn">Kirish</button>
        <button type="button" className="btn ghost" onClick={(e) => submit(e, 'up')}>Ro'yxatdan o'tish</button>
        {msg && <p className="err">{msg}</p>}
      </form>
    </div>
  );
}
