'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import CenterManager from '../CenterManager';
import CenterPhotos from '../shared/CenterPhotos';
import ContactsEditor from '../shared/ContactsEditor';
import CenterMedia from '../shared/CenterMedia';
import TgLink from '../shared/TgLink';
import ReviewQr from './ReviewQr';
import CenterLegal from './CenterLegal';

// Markaz ma'lumotlarini tahrirlash: nom, tavsif, aloqa, filiallar va kurslar
export default function CenterInfo({ center, onChange }) {
  const [f, setF] = useState({ name: center.name, description: center.description || '', refund: center.refund_policy || '' });
  const [pmsg, setPmsg] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [globalOn, setGlobalOn] = useState(true);
  const [ver, setVer] = useState(0);
  const bump = () => { setVer((x) => x + 1); onChange?.(); };

  useEffect(() => { setF({ name: center.name, description: center.description || '', refund: center.refund_policy || '' }); setMsg(''); setErr(''); }, [center.id, center.name, center.description, center.refund_policy]);
  useEffect(() => {
    supabase.from('site_settings').select('value').eq('key', 'contacts_visible').maybeSingle().then(({ data }) => setGlobalOn(data ? data.value !== false : true));
  }, []);

  async function save(e) {
    e.preventDefault(); setMsg(''); setErr('');
    if (f.name.trim().length < 2) return setErr('Markaz nomini kiriting.');
    setBusy(true);
    const { error } = await supabase.from('centers').update({ name: f.name.trim(), description: f.description.trim() || null, refund_policy: f.refund.trim().slice(0, 1500) || null }).eq('id', center.id);
    setBusy(false);
    if (error) return setErr("Saqlanmadi. Qayta urinib ko'ring.");
    setMsg('Saqlandi.'); onChange?.();
  }

  const hidden = !globalOn || center.contacts_visible === false;
  return (
    <div className="cinfo">
      <h2 className="cinfo-h">Bildirishnomalar</h2>
      <TgLink />

      <h2 className="cinfo-h">Ko'rinish</h2>
      <CenterMedia center={center} ver={ver} onChange={bump} onMsg={(m) => alertBar(m)} />
      <CenterPhotos centerId={center.id} ver={ver} onChange={bump} onMsg={(m) => { if (m) alertBar(m); }} />

      <h2 className="cinfo-h">Markaz haqida</h2>
      <form className="card stack" onSubmit={save}>
        <b>Asosiy ma'lumotlar</b>
        <label>Markaz nomi<input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} maxLength={120} /></label>
        <label>Qisqacha ma'lumot<textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} rows={5} maxLength={3000} placeholder="Markaz haqida: yo'nalishlar, o'qituvchilar, afzalliklar" /></label>
        <label>To'lov va pulni qaytarish shartlari
          <textarea value={f.refund} onChange={(e) => setF({ ...f, refund: e.target.value })} rows={4} maxLength={1500} placeholder="Masalan: to'lov har oy boshida. O'quvchi 1-hafta ichida o'qishni to'xtatsa, oylik to'lovning 50% qaytariladi." />
          <small className="muted">Markaz sahifasida ko'rinadi. Ochiq shartlar ota-onalar ishonchini oshiradi.</small>
        </label>
        <div className="row" style={{ justifyContent: 'flex-start' }}><button className="btn sm" disabled={busy}>Saqlash</button></div>
        {msg ? <div className="formmsg ok">{msg}</div> : null}
        {err ? <div className="formmsg err">{err}</div> : null}
      </form>

      <CenterLegal center={center} />

      <div className="card stack">
        <b>Aloqa ma'lumotlari</b>
        {hidden ? <p className="note" style={{ margin: 0 }}>Hozir aloqa ma'lumotlari saytda ko'rsatilmayapti (sayt ma'muriyati sozlamasi). Foydalanuvchilar siz bilan sayt orqali ariza qoldirib bog'lanadi.</p> : null}
        <ContactsEditor centerId={center.id} onSaved={onChange} />
      </div>

      <h2 className="cinfo-h">Sharhlar</h2>
      <ReviewQr center={center} />

      <h2 className="cinfo-h">Filiallar va kurslar</h2>
      <div className="card stack">
        <b>Narxlar dolzarbligi</b>
        <p className="muted small">Saytda har bir narx yonida u qachon yangilangani ko'rsatiladi. 60 kundan eski narx "o'zgargan bo'lishi mumkin" deb belgilanadi. Narxlar o'zgarmagan bo'lsa, shu tugmani bosing.</p>
        <div className="row" style={{ justifyContent: 'flex-start' }}>
          <button type="button" className="btn ghost sm" onClick={async () => {
            setPmsg('');
            const { data, error } = await supabase.rpc('confirm_center_prices', { p_center: center.id });
            setPmsg(error ? "Bajarilmadi. Qayta urinib ko'ring." : data ? `${data} ta kurs narxi tasdiqlandi.` : "Narxi kiritilgan kurs yo'q. Avval pastda kurslarga narx qo'ying.");
          }}>Narxlarim hozir ham to'g'ri</button>
        </div>
        {pmsg ? <div className="formmsg ok">{pmsg}</div> : null}
      </div>
      <CenterManager centerId={center.id} onMsg={(m) => { setMsg(''); setErr(''); if (m) alertBar(m); }} />
    </div>
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
