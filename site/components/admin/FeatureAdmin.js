'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { regionById } from '../../lib/regions';
import { rpcMsg } from '../../lib/auth';

const norm = (t) => String(t || '').toLowerCase().replace(/[ʻʼ‘’`']/g, "'");
const FIELDS = 'id,name,rating,is_featured,is_verified,contacts_visible,owner_id,branches(region_id)';

// Markazlar belgilari ("Tavsiya etilgan", "Tasdiqlangan") va aloqa ma'lumotlarining saytda ko'rinishi
export default function FeatureAdmin() {
  const [rows, setRows] = useState(null);
  const [q, setQ] = useState('');
  const [only, setOnly] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState('');
  const [globalOn, setGlobalOn] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.from('site_settings').select('value').eq('key', 'contacts_visible').maybeSingle();
      setGlobalOn(s ? s.value !== false : true);
      const all = [];
      for (let from = 0; from < 20000; from += 1000) {
        const { data, error } = await supabase.from('centers').select(FIELDS).order('name').range(from, from + 999);
        if (error) { setErr(error.message); break; }
        all.push(...(data || []));
        if (!data || data.length < 1000) break;
      }
      setRows(all);
    })();
  }, []);

  const list = useMemo(() => {
    let r = rows || [];
    if (only === 'f') r = r.filter((x) => x.is_featured);
    if (only === 'v') r = r.filter((x) => x.is_verified);
    if (only === 'h') r = r.filter((x) => x.contacts_visible === false);
    if (only === 'k') r = r.filter((x) => x.owner_id);
    if (q.trim()) { const n = norm(q.trim()); r = r.filter((x) => norm(x.name).includes(n)); }
    return r.slice(0, 300);
  }, [rows, q, only]);

  async function toggle(c, field) {
    const on = !(field === 'contacts_visible' ? c.contacts_visible !== false : c[field]);
    setBusy(c.id + field); setErr('');
    const call = field === 'contacts_visible'
      ? supabase.rpc('admin_set_center_contacts_visible', { p_center: c.id, p_on: on })
      : supabase.rpc(field === 'is_featured' ? 'admin_set_featured' : 'admin_set_verified', { p_center: c.id, p_on: on });
    const { error } = await call;
    setBusy('');
    if (error) return setErr(rpcMsg(error, error.message));
    setRows((r) => r.map((x) => (x.id === c.id ? { ...x, [field]: on } : x)));
  }

  async function toggleGlobal(on) {
    if (!confirm(on ? "Barcha markazlarning aloqa ma'lumotlari saytda ko'rsatilsinmi?" : "Barcha markazlarning veb-sayti, telefoni, Telegram va Instagrami saytdan yashirilsinmi?")) return;
    setBusy('global'); setErr('');
    const { error } = await supabase.rpc('admin_set_contacts_visible', { p_on: on });
    setBusy('');
    if (error) return setErr(rpcMsg(error, error.message));
    setGlobalOn(on);
  }

  const all = rows || [];
  const nF = all.filter((x) => x.is_featured).length;
  const nV = all.filter((x) => x.is_verified).length;
  const nH = all.filter((x) => x.contacts_visible === false).length;
  const nK = all.filter((x) => x.owner_id).length;

  return (
    <div className="wrap page">
      <h1 className="h1s">Belgilar va kontaktlar</h1>
      <p className="muted" style={{ marginBottom: 14 }}>«Tavsiya etilgan» markazlar qidiruv natijalari va bosh sahifada birinchi ko'rsatiladi. «Tasdiqlangan» belgisi ma'lumotlari tekshirilgan markazlarga qo'yiladi.</p>

      <div className={'card gswitch' + (globalOn === false ? ' off' : '')}>
        <div>
          <b>Aloqa ma'lumotlari: {globalOn === null ? '...' : globalOn ? "saytda ko'rinadi" : 'saytdan yashirilgan'}</b>
          <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>
            Bitta tugma bilan barcha markazlarning veb-sayti, telefon raqamlari, Telegram va Instagrami ko'rsatiladi yoki yashiriladi.
            Yashirilganda foydalanuvchilar markaz bilan faqat sayt orqali ariza qoldirib bog'lanadi. Alohida markaz uchun pastdagi jadvaldan foydalaning.
          </p>
        </div>
        <button type="button" className={'btn' + (globalOn ? ' danger' : '')} disabled={globalOn === null || busy === 'global'} onClick={() => toggleGlobal(!globalOn)}>
          {busy === 'global' ? 'Bajarilmoqda...' : globalOn ? 'Hammasini yashirish' : "Hammasini ko'rsatish"}
        </button>
      </div>

      <div className="tabs">
        <button type="button" className={'tab' + (!only ? ' on' : '')} onClick={() => setOnly('')}>Barchasi ({all.length})</button>
        <button type="button" className={'tab' + (only === 'f' ? ' on' : '')} onClick={() => setOnly('f')}>Tavsiya etilgan ({nF})</button>
        <button type="button" className={'tab' + (only === 'v' ? ' on' : '')} onClick={() => setOnly('v')}>Tasdiqlangan ({nV})</button>
        <button type="button" className={'tab' + (only === 'h' ? ' on' : '')} onClick={() => setOnly('h')}>Kontakti yashirilgan ({nH})</button>
        <button type="button" className={'tab' + (only === 'k' ? ' on' : '')} onClick={() => setOnly('k')}>Kabineti bor ({nK})</button>
      </div>
      <input className="asearch" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Markaz nomi bo'yicha qidirish" />
      <p className="muted" style={{ fontSize: 13, margin: '-4px 0 12px' }}>Ro'yxatda ko'pi bilan 300 ta markaz ko'rsatiladi, kerakli markazni nomi bo'yicha qidiring.</p>
      {err ? <div className="formmsg err">{err}</div> : null}
      {rows === null ? <div className="card muted">Yuklanmoqda...</div> : (
        <div className="card ascroll" style={{ padding: 0 }}>
          <table className="atable">
            <thead><tr><th>Markaz</th><th>Viloyat</th><th>Reyting</th><th>Tavsiya etilgan</th><th>Tasdiqlangan</th><th>Kontaktlar</th></tr></thead>
            <tbody>
              {list.map((c) => {
                const regs = [...new Set((c.branches || []).map((b) => b.region_id))].map((r) => regionById(r)?.short).filter(Boolean);
                const vis = c.contacts_visible !== false;
                return (
                  <tr key={c.id}>
                    <td><Link className="ok" href={`/centers/${c.id}`} target="_blank">{c.name}</Link>{c.owner_id ? <span className="pillst" style={{ marginLeft: 6 }}>kabinet</span> : null}</td>
                    <td className="muted">{regs.slice(0, 3).join(', ')}{regs.length > 3 ? '…' : ''}</td>
                    <td>{c.rating && Number(c.rating) > 0 ? Number(c.rating).toFixed(1) : '—'}</td>
                    <td><label className="tgl"><input type="checkbox" checked={!!c.is_featured} disabled={busy === c.id + 'is_featured'} onChange={() => toggle(c, 'is_featured')} />{c.is_featured ? 'Ha' : "Yo'q"}</label></td>
                    <td><label className="tgl"><input type="checkbox" checked={!!c.is_verified} disabled={busy === c.id + 'is_verified'} onChange={() => toggle(c, 'is_verified')} />{c.is_verified ? 'Ha' : "Yo'q"}</label></td>
                    <td><label className="tgl"><input type="checkbox" checked={vis} disabled={busy === c.id + 'contacts_visible'} onChange={() => toggle(c, 'contacts_visible')} />{vis ? (globalOn === false ? 'Yoqilgan (umumiy yashirilgan)' : "Ko'rinadi") : 'Yashirilgan'}</label></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
