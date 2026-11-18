'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { rpcMsg } from '../../lib/auth';

const TABS = [['pending', 'Yangi'], ['approved', 'Tasdiqlangan'], ['rejected', 'Rad etilgan']];
const fmt = (d) => (d ? new Date(d).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' }) : '');

// Bosh admin: markazlarning ro'yxatdan o'tish so'rovlari (tasdiqlash yoki rad etish)
export default function CenterRequests() {
  const [tab, setTab] = useState('pending');
  const [list, setList] = useState(null);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(0);
  const [note, setNote] = useState({});

  const load = useCallback(async () => {
    setList(null); setErr('');
    const { data, error } = await supabase.rpc('admin_center_requests', { p_status: tab });
    if (error) { setErr(rpcMsg(error, "So'rovlarni yuklab bo'lmadi.")); setList([]); return; }
    setList(data || []);
  }, [tab]);
  useEffect(() => { load(); }, [load]);

  async function decide(r, approve) {
    if (!approve && !(note[r.id] || '').trim() && !window.confirm('Sababsiz rad etilsinmi?')) return;
    setBusy(r.id); setErr(''); setMsg('');
    const { data, error } = await supabase.rpc('admin_decide_center_request', { p_id: r.id, p_approve: approve, p_note: note[r.id] || null, p_link_center: null });
    setBusy(0);
    if (error) return setErr(rpcMsg(error));
    setMsg(approve ? `«${r.center_name}» tasdiqlandi, markaz kabineti ochildi.` : `«${r.center_name}» rad etildi.`);
    try { window.dispatchEvent(new Event('es-admin-counts')); } catch {}
    if (approve && data?.center_id) setMsg((m) => m + ' ');
    load();
  }

  return (
    <div className="creq">
      <div className="tabs">
        {TABS.map(([k, t]) => <button key={k} type="button" className={'tab' + (tab === k ? ' on' : '')} onClick={() => setTab(k)}>{t}</button>)}
      </div>
      {msg ? <div className="formmsg ok" role="status">{msg}</div> : null}
      {err ? <div className="formmsg err" role="alert">{err}</div> : null}
      {list === null ? <div className="card"><div className="sk sk-t" /><div className="sk sk-s" style={{ marginTop: 10 }} /></div>
        : !list.length ? <div className="card"><p className="muted">{tab === 'pending' ? "Hozircha yangi so'rov yo'q." : "Bu bo'limda so'rov yo'q."}</p></div>
        : list.map((r) => (
          <article key={r.id} className="card creq-i">
            <header className="creq-h">
              <div>
                <h3>{r.center_name}</h3>
                <small className="muted">{`№${r.id} · ${fmt(r.created_at)}`}</small>
              </div>
              <span className={'csu-badge ' + (r.status === 'pending' ? 'wait' : r.status === 'approved' ? 'ok' : 'bad')}>{r.status === 'pending' ? 'Yangi' : r.status === 'approved' ? 'Tasdiqlangan' : 'Rad etilgan'}</span>
            </header>
            <dl className="creq-d">
              <dt>Mas'ul shaxs</dt><dd>{r.contact_name}</dd>
              <dt>Telefon</dt><dd><a href={'tel:' + String(r.phone).replace(/[^\d+]/g, '')}>{r.phone}</a></dd>
              {r.telegram ? <><dt>Telegram</dt><dd>{r.telegram}</dd></> : null}
              <dt>Hudud</dt><dd>{[r.region_name, r.district_name].filter(Boolean).join(', ')}</dd>
              {r.address ? <><dt>Manzil</dt><dd>{r.address}</dd></> : null}
              <dt>Joylashuv</dt><dd>{r.lat ? <a href={`https://yandex.uz/maps/?pt=${r.lng},${r.lat}&z=16`} target="_blank" rel="noopener noreferrer">Xaritada ko'rish</a> : 'Belgilanmagan (tuman/viloyat markazi qo\'yiladi)'}</dd>
              <dt>Yo'nalishlar</dt><dd>{r.category_names || '—'}</dd>
              {r.note ? <><dt>Izoh</dt><dd>{r.note}</dd></> : null}
              <dt>Kabinet</dt><dd>{r.login || r.email || '—'}{r.user_name ? ` (${r.user_name})` : ''}</dd>
              {r.existing_center_id ? <><dt>Saytdagi markaz</dt><dd><Link href={`/centers/${r.existing_center_id}`} target="_blank">{r.existing_center_name}</Link> — kabinet shu markazga biriktiriladi</dd></> : null}
              {r.admin_note ? <><dt>Admin izohi</dt><dd>{r.admin_note}</dd></> : null}
              {r.center_id ? <><dt>Markaz</dt><dd><Link href={`/centers/${r.center_id}`} target="_blank">Sahifani ochish</Link></dd></> : null}
            </dl>
            {r.status === 'pending' ? (
              <div className="creq-a">
                <input placeholder="Izoh (rad etilsa sababi foydalanuvchiga ko'rinadi)" maxLength={500} value={note[r.id] || ''} onChange={(e) => setNote((n) => ({ ...n, [r.id]: e.target.value }))} />
                <div className="row">
                  <button type="button" className="btn" disabled={busy === r.id} onClick={() => decide(r, true)}>{busy === r.id ? 'Kutib turing…' : 'Tasdiqlash va kabinet ochish'}</button>
                  <button type="button" className="btn ghost" disabled={busy === r.id} onClick={() => decide(r, false)}>Rad etish</button>
                </div>
              </div>
            ) : null}
          </article>
        ))}
    </div>
  );
}
