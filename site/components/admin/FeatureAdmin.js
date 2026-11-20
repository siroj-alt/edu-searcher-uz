'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { regionById } from '../../lib/regions';
import { rpcMsg } from '../../lib/auth';
import Switch from '../Switch';

const norm = (t) => String(t || '').toLowerCase().replace(/[ʻʼ‘’`']/g, "'");
const FIELDS = 'id,name,rating,is_featured,is_verified,docs_verified,is_sponsored,contacts_visible,is_hidden,owner_id,branches(region_id)';

// Markazlar belgilari ("Tavsiya etilgan", "Tasdiqlangan") va aloqa ma'lumotlarining saytda ko'rinishi
export default function FeatureAdmin() {
  const [rows, setRows] = useState(null);
  const [q, setQ] = useState('');
  const [only, setOnly] = useState('');
  const [err, setErr] = useState('');
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
    if (only === 'x') r = r.filter((x) => x.is_hidden);
    if (only === 'k') r = r.filter((x) => x.owner_id);
    if (only === 'd') r = r.filter((x) => x.docs_verified);
    if (only === 'a') r = r.filter((x) => x.is_sponsored);
    if (q.trim()) { const n = norm(q.trim()); r = r.filter((x) => norm(x.name).includes(n)); }
    return r.slice(0, 300);
  }, [rows, q, only]);

  // Holatni o'zgartiradi: muvaffaqiyatli bo'lsa true. Ma'lumotlar o'chirilmaydi, faqat saytda ko'rinishi o'zgaradi.
  async function toggle(c, field, on) {
    setErr('');
    const call = field === 'contacts_visible'
      ? supabase.rpc('admin_set_center_contacts_visible', { p_center: c.id, p_on: on })
      : field === 'is_hidden'
        ? supabase.rpc('admin_set_center_hidden', { p_center: c.id, p_hidden: on })
        : field === 'docs_verified' || field === 'is_sponsored'
          ? supabase.rpc('admin_set_center_flag', { p_center: c.id, p_field: field, p_on: on })
        : supabase.rpc(field === 'is_featured' ? 'admin_set_featured' : 'admin_set_verified', { p_center: c.id, p_on: on });
    const { error } = await call;
    if (error) { setErr(rpcMsg(error, error.message)); return false; }
    setRows((r) => r.map((x) => (x.id === c.id ? { ...x, [field]: on } : x)));
    return true;
  }

  async function toggleGlobal(on) {
    if (!confirm(on ? "Barcha markazlarning aloqa ma'lumotlari saytda ko'rsatilsinmi?" : "Barcha markazlarning veb-sayti, telefoni, Telegram va Instagrami saytdan yashirilsinmi? Ma'lumotlar o'chirilmaydi, qayta yoqsangiz o'z joyiga qaytadi.")) return false;
    setErr('');
    const { error } = await supabase.rpc('admin_set_contacts_visible', { p_on: on });
    if (error) { setErr(rpcMsg(error, error.message)); return false; }
    setGlobalOn(on);
    return true;
  }

  const all = rows || [];
  const nF = all.filter((x) => x.is_featured).length;
  const nV = all.filter((x) => x.is_verified).length;
  const nH = all.filter((x) => x.contacts_visible === false).length;
  const nK = all.filter((x) => x.owner_id).length;
  const nX = all.filter((x) => x.is_hidden).length;
  const nD = all.filter((x) => x.docs_verified).length;
  const nA = all.filter((x) => x.is_sponsored).length;

  return (
    <div className="wrap page">
      <h1 className="h1s">Belgilar va kontaktlar</h1>
      <p className="muted" style={{ marginBottom: 14 }}>«Tavsiya etilgan» markazlar qidiruv natijalari va bosh sahifada birinchi ko'rsatiladi. «Tasdiqlangan» belgisi ma'lumotlari tekshirilgan markazlarga qo'yiladi. «Hujjatlari tekshirilgan» — markaz faoliyat xabarnomasini ko'rsatganda. «Reklama» — pullik joylashuv: markaz ro'yxatlarda birinchi chiqadi va kartada «Reklama» deb belgilanadi.</p>

      <div className="card swgroup">
        <Switch checked={!!globalOn} disabled={globalOn === null} onChange={toggleGlobal}
          label="Aloqa ma'lumotlari saytda ko'rinsin"
          sub="Barcha markazlarning veb-sayti, telefoni, Telegram va Instagrami. O'chirilsa ma'lumotlar bazada saqlanib qoladi va foydalanuvchilar faqat ariza orqali bog'lanadi; yoqilganda hammasi qaytadi." />
      </div>

      <div className="tabs">
        <button type="button" className={'tab' + (!only ? ' on' : '')} onClick={() => setOnly('')}>Barchasi ({all.length})</button>
        <button type="button" className={'tab' + (only === 'f' ? ' on' : '')} onClick={() => setOnly('f')}>Tavsiya etilgan ({nF})</button>
        <button type="button" className={'tab' + (only === 'v' ? ' on' : '')} onClick={() => setOnly('v')}>Tasdiqlangan ({nV})</button>
        <button type="button" className={'tab' + (only === 'h' ? ' on' : '')} onClick={() => setOnly('h')}>Kontakti yashirilgan ({nH})</button>
        <button type="button" className={'tab' + (only === 'k' ? ' on' : '')} onClick={() => setOnly('k')}>Kabineti bor ({nK})</button>
        <button type="button" className={'tab' + (only === 'x' ? ' on' : '')} onClick={() => setOnly('x')}>Saytdan yashirilgan ({nX})</button>
        <button type="button" className={'tab' + (only === 'd' ? ' on' : '')} onClick={() => setOnly('d')}>Hujjatlari tekshirilgan ({nD})</button>
        <button type="button" className={'tab' + (only === 'a' ? ' on' : '')} onClick={() => setOnly('a')}>Reklama ({nA})</button>
      </div>
      <input className="asearch" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Markaz nomi bo'yicha qidirish" />
      <p className="muted" style={{ fontSize: 13, margin: '-4px 0 12px' }}>Ro'yxatda ko'pi bilan 300 ta markaz ko'rsatiladi, kerakli markazni nomi bo'yicha qidiring.</p>
      {err ? <div className="formmsg err">{err}</div> : null}
      {rows === null ? <div className="card muted">Yuklanmoqda...</div> : (
        <div className="card ascroll" style={{ padding: 0 }}>
          <table className="atable">
            <thead><tr><th>Markaz</th><th>Viloyat</th><th>Reyting</th><th>Saytda</th><th>Tavsiya etilgan</th><th>Tasdiqlangan</th><th>Hujjatlari tekshirilgan</th><th>Reklama</th><th>Kontaktlar</th></tr></thead>
            <tbody>
              {list.map((c) => {
                const regs = [...new Set((c.branches || []).map((b) => b.region_id))].map((r) => regionById(r)?.short).filter(Boolean);
                const vis = c.contacts_visible !== false;
                return (
                  <tr key={c.id}>
                    <td><Link className="ok" href={`/centers/${c.id}`} target="_blank">{c.name}</Link>{c.owner_id ? <span className="pillst" style={{ marginLeft: 6 }}>kabinet</span> : null}</td>
                    <td className="muted">{regs.slice(0, 3).join(', ')}{regs.length > 3 ? '…' : ''}</td>
                    <td>{c.rating && Number(c.rating) > 0 ? Number(c.rating).toFixed(1) : '—'}</td>
                    <td><span className="swcell"><Switch checked={!c.is_hidden} onChange={(on) => toggle(c, 'is_hidden', !on)} ariaLabel={`${c.name}: saytda ko'rinsin`} /><small>{c.is_hidden ? 'Yashirilgan' : "Ko'rinadi"}</small></span></td>
                    <td><span className="swcell"><Switch checked={!!c.is_featured} onChange={(on) => toggle(c, 'is_featured', on)} ariaLabel={`${c.name}: tavsiya etilgan`} /></span></td>
                    <td><span className="swcell"><Switch checked={!!c.is_verified} onChange={(on) => toggle(c, 'is_verified', on)} ariaLabel={`${c.name}: tasdiqlangan`} /></span></td>
                    <td><span className="swcell"><Switch checked={!!c.docs_verified} onChange={(on) => toggle(c, 'docs_verified', on)} ariaLabel={`${c.name}: hujjatlari tekshirilgan`} /></span></td>
                    <td><span className="swcell"><Switch checked={!!c.is_sponsored} onChange={(on) => toggle(c, 'is_sponsored', on)} ariaLabel={`${c.name}: reklama (pullik joy)`} /></span></td>
                    <td><span className="swcell"><Switch checked={vis} onChange={(on) => toggle(c, 'contacts_visible', on)} ariaLabel={`${c.name}: aloqa ma'lumotlari ko'rinsin`} /><small>{vis ? (globalOn === false ? 'Umumiy yashirilgan' : "Ko'rinadi") : 'Yashirilgan'}</small></span></td>
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
