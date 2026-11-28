'use client';
import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { useMe, refreshMe, rpcMsg } from '../lib/auth';

const WORD = "O'CHIRISH";
const EMAIL = 'yunusnorbekov1977@gmail.com';

// Hisobni o'chirish: kirgan foydalanuvchi uchun tasdiqlash, mehmon uchun kirish va aloqa yo'li
export default function DeleteAccount() {
  const me = useMe();
  const [word, setWord] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);

  async function remove(e) {
    e.preventDefault();
    if (word.trim().toUpperCase().replace(/[‘’`ʻʼ]/g, "'") !== WORD) return setErr(`Tasdiqlash uchun ${WORD} so'zini yozing.`);
    setBusy(true); setErr('');
    try {
      const { data: rows } = await supabase.from('center_results').select('photo_url').eq('user_id', me.id);
      const paths = (rows || []).map((r) => { const m = String(r.photo_url || '').match(/\/results\/([^?]+)/); return m ? decodeURIComponent(m[1]) : null; }).filter(Boolean);
      if (paths.length) await supabase.storage.from('results').remove(paths);
    } catch {}
    const { error } = await supabase.rpc('delete_my_account');
    if (error) { setBusy(false); return setErr(rpcMsg(error, "Hisobni o'chirib bo'lmadi. Internetni tekshirib, qayta urinib ko'ring.")); }
    try { await supabase.auth.signOut(); } catch {}
    try { localStorage.clear(); } catch {}
    await refreshMe();
    setBusy(false); setDone(true);
  }

  if (done) {
    return (
      <div className="card stack">
        <b>Hisobingiz o'chirildi</b>
        <p>Shaxsiy ma'lumotlaringiz, arizalaringiz va sharhlaringiz bazadan olib tashlandi. Rahmat, EduSearcher'dan foydalanganingiz uchun.</p>
        <Link className="btn sm" href="/">Bosh sahifaga</Link>
      </div>
    );
  }

  if (me === undefined) return <div className="card"><p className="muted">Yuklanmoqda...</p></div>;

  if (!me) {
    return (
      <div className="card stack">
        <b>Avval hisobingizga kiring</b>
        <p>Hisobni o'zingiz o'chirish uchun kabinetga kiring, shu sahifaga qaytib, tasdiqlang.</p>
        <Link className="btn sm" href={'/kirish?next=' + encodeURIComponent('/hisobni-ochirish')}>Kirish</Link>
        <p className="muted">Kira olmayotgan bo'lsangiz, <a href={`mailto:${EMAIL}?subject=Hisobni o'chirish`}>{EMAIL}</a> manziliga yozing yoki Telegramda <a href="https://t.me/edusearcherbot" target="_blank" rel="noopener noreferrer">@edusearcherbot</a> ga murojaat qiling. Hisob egaligini tasdiqlagach, o'chiramiz.</p>
      </div>
    );
  }

  if (me.role === 'admin' || me.role === 'center_owner') {
    return (
      <div className="card stack">
        <b>{me.role === 'admin' ? 'Administrator hisobi' : "O'quv markazi egasi hisobi"}</b>
        <p>Bu hisobni bu yerdan o'chirib bo'lmaydi, chunki unga markaz va uning o'quvchilari ma'lumoti bog'langan. O'chirish uchun <a href={`mailto:${EMAIL}?subject=Markaz hisobini o'chirish`}>{EMAIL}</a> ga yoki Telegramda <a href="https://t.me/edusearcherbot" target="_blank" rel="noopener noreferrer">@edusearcherbot</a> ga yozing.</p>
      </div>
    );
  }

  return (
    <form className="card stack" onSubmit={remove}>
      <b>{me.full_name || me.login || me.email}</b>
      <p>Hisob o'chirilsa, quyidagilar <b>qaytarib bo'lmaydigan</b> tarzda o'chadi:</p>
      <ul>
        <li>profil: ism, telefon, login va kirish ma'lumotlari;</li>
        <li>markazlarga yuborgan arizalaringiz, o'qish va to'lov yozuvlaringiz;</li>
        <li>qoldirgan sharhlaringiz va yuklagan natija rasmlaringiz;</li>
        <li>Telegram botga ulangan bo'lsa, botdagi saqlanganlar va ulanishlar.</li>
      </ul>
      <label>Tasdiqlash uchun <b>{WORD}</b> deb yozing
        <input value={word} onChange={(ev) => setWord(ev.target.value)} autoComplete="off" autoCapitalize="characters" maxLength={20} />
      </label>
      <button className="btn danger sm" disabled={busy}>{busy ? "O'chirilmoqda..." : "Hisobni butunlay o'chirish"}</button>
      {err ? <div className="formmsg err">{err}</div> : null}
    </form>
  );
}
