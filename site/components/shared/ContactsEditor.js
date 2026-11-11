'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { rpcMsg } from '../../lib/auth';

// Markazning aloqa ma'lumotlari. Saytda yashirilgan paytda ham shu yerda to'liq ko'rinadi va tahrirlanadi.
export default function ContactsEditor({ centerId, onSaved }) {
  const [f, setF] = useState(null);
  const [msg, setMsg] = useState({ ok: '', err: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setF(null); setMsg({ ok: '', err: '' });
    supabase.from('center_contacts').select('phone,website,telegram,instagram').eq('center_id', centerId).maybeSingle().then(({ data }) => {
      setF({ phone: data?.phone || '', website: data?.website || '', telegram: data?.telegram || '', instagram: data?.instagram || '' });
    });
  }, [centerId]);

  async function save(e) {
    e.preventDefault(); setBusy(true); setMsg({ ok: '', err: '' });
    const { error } = await supabase.rpc('set_center_contacts', { p_center: centerId, p_phone: f.phone, p_website: f.website, p_telegram: f.telegram, p_instagram: f.instagram });
    setBusy(false);
    if (error) return setMsg({ ok: '', err: rpcMsg(error) });
    setMsg({ ok: "Aloqa ma'lumotlari saqlandi.", err: '' });
    onSaved?.();
  }

  if (!f) return <p className="muted">Yuklanmoqda...</p>;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <form className="stack" onSubmit={save}>
      <div className="two">
        <label>Asosiy telefon<input value={f.phone} onChange={set('phone')} maxLength={20} inputMode="tel" placeholder="+998 ..." /></label>
        <label>Veb-sayt<input value={f.website} onChange={set('website')} maxLength={200} placeholder="https://..." /></label>
      </div>
      <div className="two">
        <label>Telegram<input value={f.telegram} onChange={set('telegram')} maxLength={200} placeholder="https://t.me/..." /></label>
        <label>Instagram<input value={f.instagram} onChange={set('instagram')} maxLength={200} placeholder="https://instagram.com/..." /></label>
      </div>
      <div className="row" style={{ justifyContent: 'flex-start' }}><button className="btn sm" disabled={busy}>Aloqa ma'lumotlarini saqlash</button></div>
      {msg.ok ? <div className="formmsg ok">{msg.ok}</div> : null}
      {msg.err ? <div className="formmsg err">{msg.err}</div> : null}
    </form>
  );
}
