'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { rpcMsg } from '../../lib/auth';

const csvCell = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
const fmtDT = (d) => {
  const t = new Date(d); if (!d || isNaN(t)) return '';
  const p = (n) => String(n).padStart(2, '0');
  return `${p(t.getDate())}.${p(t.getMonth() + 1)}.${t.getFullYear()} ${p(t.getHours())}:${p(t.getMinutes())}`;
};

// Bosh admin: Telegram bot foydalanuvchilari (ism, username, telefon, hudud, arizalar, referallar)
export default function BotUsers() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    supabase.rpc('admin_bot_users', { p_limit: 500 }).then(({ data: d, error }) => {
      if (error) { setErr(rpcMsg(error, "Ma'lumotni yuklab bo'lmadi.")); setData({ users: [] }); return; }
      setData(d);
    });
  }, []);

  function exportCsv() {
    const head = ['Qo\'shilgan', 'Oxirgi faollik', 'Ism', 'Username', 'Telefon', 'Hudud', 'Arizalar', 'Taklif qilganlar', 'Saqlanganlar'];
    const lines = [head.map(csvCell).join(','), ...data.users.map((u) => [fmtDT(u.created_at), fmtDT(u.last_seen), u.full_name, u.username ? '@' + u.username : '', u.phone, u.region, u.applications, u.referrals, u.favorites].map(csvCell).join(','))];
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'bot-foydalanuvchilari.csv';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  if (!data) return <div className="card muted">Yuklanmoqda...</div>;
  const users = data.users || [];
  const stat = (n, l) => <div className="card" style={{ flex: '1 1 140px' }}><div style={{ fontSize: 26, fontWeight: 700 }}>{n ?? 0}</div><div className="muted">{l}</div></div>;
  return (
    <>
      {err ? <div className="formmsg err" style={{ marginBottom: 12 }}>{err}</div> : null}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        {stat(data.total, 'Foydalanuvchilar')}
        {stat(data.active_7d, 'So\'nggi 7 kunda faol')}
        {stat(data.with_phone, 'Telefon qoldirgan')}
        {stat(data.referred, 'Referal orqali kelgan')}
      </div>
      <div className="row" style={{ marginBottom: 12 }}>
        <span className="muted">Oxirgi {users.length} ta foydalanuvchi</span>
        <button type="button" className="btn ghost sm" onClick={exportCsv} disabled={!users.length}>CSV yuklab olish</button>
      </div>
      {!users.length ? <div className="card muted">Hali foydalanuvchi yo'q.</div> : (
        <div className="card ascroll" style={{ padding: 0 }}>
          <table className="atable">
            <thead><tr><th>Qo'shilgan</th><th>Ism</th><th>Username</th><th>Telefon</th><th>Hudud</th><th>Arizalar</th><th>Takliflar</th><th>Oxirgi faollik</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.tg_id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{fmtDT(u.created_at)}</td>
                  <td>{u.full_name || <span className="muted">—</span>}</td>
                  <td>{u.username ? <a className="ok" href={`https://t.me/${u.username}`} target="_blank" rel="noreferrer">@{u.username}</a> : <span className="muted">—</span>}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{u.phone || <span className="muted">—</span>}</td>
                  <td>{u.region || <span className="muted">—</span>}</td>
                  <td>{u.applications}</td>
                  <td>{u.referrals}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{fmtDT(u.last_seen)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
