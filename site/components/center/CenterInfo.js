'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import CenterManager from '../CenterManager';
import CenterPhotos from '../shared/CenterPhotos';
import ContactsEditor from '../shared/ContactsEditor';

// Markaz ma'lumotlarini tahrirlash: nom, tavsif, aloqa, filiallar va kurslar
export default function CenterInfo({ center, onChange }) {
  const [f, setF] = useState({ name: center.name, description: center.description || '' });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [globalOn, setGlobalOn] = useState(true);

  useEffect(() => { setF({ name: center.name, description: center.description || '' }); setMsg(''); setErr(''); }, [center.id, center.name, center.description]);
  useEffect(() => {
    supabase.from('site_settings').select('value').eq('key', 'contacts_visible').maybeSingle().then(({ data }) => setGlobalOn(data ? data.value !== false : true));
  }, []);

  async function save(e) {
    e.preventDefault(); setMsg(''); setErr('');
    if (f.name.trim().length < 2) return setErr('Markaz nomini kiriting.');
    setBusy(true);
    const { error } = await supabase.from('centers').update({ name: f.name.trim(), description: f.description.trim() || null }).eq('id', center.id);
    setBusy(false);
    if (error) return setErr("Saqlanmadi. Qayta urinib ko'ring.");
    setMsg('Saqlandi.'); onChange?.();
  }

  const hidden = !globalOn || center.contacts_visible === false;
  return (
    <>
      <form className="card stack" onSubmit={save}>
        <b>Asosiy ma'lumotlar</b>
        <label>Markaz nomi<input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} maxLength={120} /></label>
        <label>Qisqacha ma'lumot<textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} rows={5} maxLength={3000} placeholder="Markaz haqida: yo'nalishlar, o'qituvchilar, afzalliklar" /></label>
        <div className="row" style={{ justifyContent: 'flex-start' }}><button className="btn sm" disabled={busy}>Saqlash</button></div>
        {msg ? <div className="formmsg ok">{msg}</div> : null}
        {err ? <div className="formmsg err">{err}</div> : null}
      </form>

      <div className="card stack">
        <b>Aloqa ma'lumotlari</b>
        {hidden ? <p className="note" style={{ margin: 0 }}>Hozir aloqa ma'lumotlari saytda ko'rsatilmayapti (sayt ma'muriyati sozlamasi). Foydalanuvchilar siz bilan sayt orqali ariza qoldirib bog'lanadi.</p> : null}
        <ContactsEditor centerId={center.id} onSaved={onChange} />
      </div>

      <CenterPhotos centerId={center.id} onMsg={(m) => { if (m) alertBar(m); }} />

      <CenterManager centerId={center.id} onMsg={(m) => { setMsg(''); setErr(''); if (m) alertBar(m); }} />
    </>
  );
}

// CenterManager xabarlari uchun oddiy bildirishnoma
function alertBar(text) {
  if (typeof document === 'undefined') return;
  let el = document.getElementById('es-toast');
  if (!el) { el = document.createElement('div'); el.id = 'es-toast'; el.className = 'toast'; document.body.appendChild(el); }
  el.textContent = text; el.classList.add('on');
  clearTimeout(alertBar.t); alertBar.t = setTimeout(() => el.classList.remove('on'), 2600);
}
