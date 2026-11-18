'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { refreshMe, homeFor, safeNext } from '../lib/auth';

// Google / Apple'dan qaytgach: sessiya o'rnatiladi va foydalanuvchi kerakli sahifaga o'tadi
export default function AuthCallback() {
  const router = useRouter();
  const [err, setErr] = useState('');
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const next = safeNext(sp.get('next') || '');
    const fail = sp.get('error_description') || sp.get('error');
    if (fail) { setErr(/denied|cancel/i.test(fail) ? 'Kirish bekor qilindi.' : "Kirib bo'lmadi. Qayta urinib ko'ring."); return; }
    let done = false;
    const finish = async () => {
      if (done) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      done = true;
      const me = await refreshMe();
      router.replace(next || homeFor(me));
    };
    const code = sp.get('code');
    (async () => {
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error && !/already|used|invalid/i.test(error.message || '')) { setErr("Kirib bo'lmadi. Qayta urinib ko'ring."); return; }
      }
      await finish();
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((ev) => { if (ev === 'SIGNED_IN') finish(); });
    const t = setTimeout(async () => { if (!done) { const { data: { session } } = await supabase.auth.getSession(); if (!session) setErr("Kirib bo'lmadi. Qayta urinib ko'ring."); } }, 8000);
    return () => { sub?.subscription?.unsubscribe(); clearTimeout(t); };
  }, [router]);
  return (
    <div className="auth">
      <div className="card stack" style={{ textAlign: 'center' }}>
        {err ? (
          <>
            <b>{err}</b>
            <Link className="btn" href="/kirish">Kirish sahifasiga qaytish</Link>
          </>
        ) : (
          <>
            <span className="spinner" aria-hidden="true" />
            <b>Kabinetga kirilmoqda…</b>
          </>
        )}
      </div>
    </div>
  );
}
