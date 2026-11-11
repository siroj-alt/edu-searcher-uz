'use client';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { rpcMsg, fmtDay } from '../../lib/auth';

const ROLE = { user: 'Foydalanuvchi', center_owner: 'Markaz egasi', admin: 'Admin' };

// Bosh admin: foydalanuvchilar ro'yxati va parolni yangilash
export default function UsersAdmin({ onMsg }) {
  const [rows, setRows] = useState(null);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');

  const load = useCallback(async (text) => {
    let query = supabase.from('profiles').select('id,login,email,full_name,phone,role,created_at');
    const t = String(text || '').replace(/[,()%*]/g, ' ').trim();
    if (t) query = query.or(`login.ilike.%${t}%,full_name.ilike.%${t}%,phone.ilike.%${t}%`);
    const { data, error } = await query.order('created_at', { ascending: false }).limit(300);
    if (error) { setErr("Ro'yxatni yuklab bo'lmadi."); setRows([]); return; }
    setErr(''); setRows(data || []);
  }, []);
  useEffect(() => { load(''); }, [load]);

  async function reset(e, u) {
    e.preventDefault(); setErr('');
    if (pw.length < 6) return setErr("Parol kamida 6 belgidan iborat bo'lsin.");
    const { error } = await supabase.rpc('admin_set_password', { p_user: u.id, p_password: pw });
    if (error) return setErr(rpcMsg(error));
    onMsg?.(`${u.login || u.email} uchun parol yangilandi`); setOpen(''); setPw('');
  }

  return (
    <>
      <form className="qform" onSubmit={(e) => { e.preventDefault(); load(q); }}>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Login, ism yoki telefon bo'yicha qidirish" />
        <button className="btn">Qidirish</button>
      </form>
      <p className="muted" style={{ fontSize: 13, margin: '4px 0 12px' }}>Eng oxirgi 300 ta hisob ko'rsatiladi. Parolini unutgan foydalanuvchiga shu yerdan yangi parol qo'yib berasiz.</p>
      {err ? <div className="formmsg err" style={{ marginBottom: 12 }}>{err}</div> : null}
      {rows === null ? <div className="card muted">Yuklanmoqda...</div> : !rows.length ? <div className="card muted">Hisob topilmadi.</div> : (
        <div className="card ascroll" style={{ padding: 0 }}>
          <table className="atable">
            <thead><tr><th>Ism familiya</th><th>Login</th><th>Telefon</th><th>Rol</th><th>Ro'yxatdan o'tgan</th><th /></tr></thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id}>
                  <td>{u.full_name || '—'}</td>
                  <td>{u.login || u.email || '—'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{u.phone || '—'}</td>
                  <td><span className={'pillst ' + (u.role === 'user' ? 'rejected' : '')}>{ROLE[u.role] || u.role}</span></td>
                  <td style={{ whiteSpace: 'nowrap' }}>{fmtDay(u.created_at)}</td>
                  <td>
                    {u.role === 'admin' ? null : open === u.id ? (
                      <form className="acts" onSubmit={(e) => reset(e, u)}>
                        <input value={pw} onChange={(e) => setPw(e.target.value)} maxLength={72} placeholder="Yangi parol" autoComplete="off" style={{ width: 150, padding: '7px 10px' }} />
                        <button className="btn sm">Saqlash</button>
                        <button type="button" className="btn ghost sm" onClick={() => { setOpen(''); setPw(''); }}>Bekor</button>
                      </form>
                    ) : <button type="button" className="btn ghost sm" onClick={() => { setOpen(u.id); setPw(''); setErr(''); }}>Parolni yangilash</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
