'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { tel } from '../../lib/cats';
import { rpcMsg, fmtSum, fmtDay, fmtMonth, monthsFrom, thisMonth, PAY_METHOD } from '../../lib/auth';

const TABS = [['active', "O'qiyotganlar"], ['done', 'Tugatgan / chiqqan'], ['', 'Barchasi']];
const ST = { active: "O'qiyapti", finished: 'Tugatdi', left: 'Chiqib ketdi' };
const norm = (t) => String(t || '').toLowerCase();

// Markazning o'quvchilari: kurs va guruh bo'yicha
export default function Students({ centerId, onChange }) {
  const [tab, setTab] = useState('active');
  const [rows, setRows] = useState(null);
  const [pays, setPays] = useState({});
  const [q, setQ] = useState('');
  const [err, setErr] = useState('');
  const [open, setOpen] = useState(null); // { id, mode: 'edit' | 'pay' }
  const month = thisMonth();

  const load = useCallback(async () => {
    const [e, p] = await Promise.all([
      supabase.from('enrollments').select('id,course_name,group_name,full_name,phone,monthly_fee,started_on,ended_on,status').eq('center_id', centerId).order('course_name').order('full_name').limit(2000),
      supabase.from('payments').select('enrollment_id,status,amount').eq('center_id', centerId).eq('period', month).neq('status', 'rejected')
    ]);
    if (e.error) { setErr("O'quvchilarni yuklab bo'lmadi."); setRows([]); return; }
    setErr(''); setRows(e.data || []);
    setPays(Object.fromEntries((p.data || []).map((x) => [x.enrollment_id, x])));
  }, [centerId, month]);
  useEffect(() => { setRows(null); load(); }, [load]);

  const changed = () => { setOpen(null); load(); onChange?.(); };

  const groups = useMemo(() => {
    let r = rows || [];
    if (tab === 'active') r = r.filter((x) => x.status === 'active');
    if (tab === 'done') r = r.filter((x) => x.status !== 'active');
    if (q.trim()) { const n = norm(q.trim()); r = r.filter((x) => norm(x.full_name).includes(n) || norm(x.phone).replace(/\D/g, '').includes(n.replace(/\D/g, '') || '~')); }
    const out = {};
    for (const x of r) { const k = x.course_name + (x.group_name ? ' · ' + x.group_name : ''); (out[k] = out[k] || []).push(x); }
    return Object.entries(out);
  }, [rows, tab, q]);

  const nActive = (rows || []).filter((x) => x.status === 'active').length;
  return (
    <>
      <div className="tabs">
        {TABS.map(([k, v]) => <button key={k || 'all'} type="button" className={'tab' + (tab === k ? ' on' : '')} onClick={() => setTab(k)}>{v}{k === 'active' && rows ? ` (${nActive})` : ''}</button>)}
      </div>
      <input className="asearch" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ism yoki telefon bo'yicha qidirish" />
      {err ? <div className="formmsg err" style={{ marginBottom: 12 }}>{err}</div> : null}
      {rows === null ? <div className="card muted">Yuklanmoqda...</div> : !groups.length ? (
        <div className="card muted">{rows.length ? "Bu bo'limda o'quvchi yo'q." : "Hali o'quvchi yo'q. «Arizalar» bo'limida arizani qabul qilsangiz, o'quvchi shu yerda paydo bo'ladi."}</div>
      ) : groups.map(([name, list]) => (
        <div key={name}>
          <div className="sec" style={{ margin: '22px 0 10px' }}><h2 style={{ fontSize: 19 }}>{name} ({list.length})</h2><i /></div>
          <div className="card ascroll" style={{ padding: 0 }}>
            <table className="atable">
              <thead><tr><th>O'quvchi</th><th>Telefon</th><th>Boshlagan</th><th>Oylik to'lov</th><th>{fmtMonth(month)}</th><th>Holat</th><th /></tr></thead>
              <tbody>
                {list.map((x) => {
                  const p = pays[x.id];
                  const mode = open?.id === x.id ? open.mode : '';
                  return (
                    <RowGroup key={x.id}>
                      <tr>
                        <td><b>{x.full_name}</b></td>
                        <td style={{ whiteSpace: 'nowrap' }}><a className="ok" href={tel(x.phone)}>{x.phone}</a></td>
                        <td style={{ whiteSpace: 'nowrap' }}>{fmtDay(x.started_on)}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{x.monthly_fee ? fmtSum(x.monthly_fee) : <span className="muted">Belgilanmagan</span>}</td>
                        <td>{p ? <span className={'pillst ' + (p.status === 'pending' ? 'pending' : '')}>{p.status === 'paid' ? "To'langan" : 'Tekshirilmoqda'}</span> : x.status === 'active' ? <span className="pillst rejected">To'lanmagan</span> : '—'}</td>
                        <td><span className={'pillst ' + (x.status === 'active' ? '' : 'rejected')}>{ST[x.status]}</span></td>
                        <td>
                          <div className="acts">
                            <button type="button" className="btn sm" onClick={() => setOpen(mode === 'pay' ? null : { id: x.id, mode: 'pay' })}>To'lov qabul qilish</button>
                            <button type="button" className="btn ghost sm" onClick={() => setOpen(mode === 'edit' ? null : { id: x.id, mode: 'edit' })}>Tahrirlash</button>
                          </div>
                        </td>
                      </tr>
                      {mode === 'edit' ? <tr><td colSpan={7}><EditForm x={x} onDone={changed} onCancel={() => setOpen(null)} /></td></tr> : null}
                      {mode === 'pay' ? <tr><td colSpan={7}><PayForm x={x} onDone={changed} onCancel={() => setOpen(null)} /></td></tr> : null}
                    </RowGroup>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </>
  );
}

const RowGroup = ({ children }) => <>{children}</>;

function EditForm({ x, onDone, onCancel }) {
  const [f, setF] = useState({ group: x.group_name || '', fee: x.monthly_fee != null ? String(x.monthly_fee) : '', status: x.status, start: x.started_on });
  const [st, setSt] = useState({ busy: false, err: '' });
  async function submit(e) {
    e.preventDefault();
    const fee = f.fee === '' ? null : Math.round(Number(f.fee));
    if (fee !== null && (!Number.isFinite(fee) || fee < 0)) return setSt({ busy: false, err: "Oylik to'lovni raqam bilan kiriting." });
    setSt({ busy: true, err: '' });
    const { error } = await supabase.rpc('update_enrollment', { p_id: x.id, p_group: f.group, p_fee: fee, p_status: f.status, p_start: f.start || null });
    if (error) return setSt({ busy: false, err: rpcMsg(error) });
    onDone();
  }
  return (
    <form className="subform" onSubmit={submit}>
      <b>{x.full_name}</b>
      <div className="fgrid2">
        <label>Guruh<input value={f.group} onChange={(e) => setF({ ...f, group: e.target.value })} maxLength={60} placeholder="Masalan: Du-Chor-Ju 18:00" /></label>
        <label>Oylik to'lov (so'm)<input value={f.fee} onChange={(e) => setF({ ...f, fee: e.target.value })} type="number" min="0" step="1000" /></label>
        <label>Holat
          <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
            {Object.entries(ST).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label>Boshlagan sana<input value={f.start || ''} onChange={(e) => setF({ ...f, start: e.target.value })} type="date" /></label>
      </div>
      <div className="row" style={{ justifyContent: 'flex-start' }}>
        <button className="btn sm" disabled={st.busy}>Saqlash</button>
        <button type="button" className="btn ghost sm" onClick={onCancel}>Bekor qilish</button>
      </div>
      {st.err ? <div className="formmsg err">{st.err}</div> : null}
    </form>
  );
}

// To'lovni markaz o'zi kiritadi (masalan, naqd olganda)
function PayForm({ x, onDone, onCancel }) {
  const months = monthsFrom(x.started_on, 1).slice(0, 24);
  const [f, setF] = useState({ period: months.includes(thisMonth()) ? thisMonth() : months[0] || thisMonth(), amount: x.monthly_fee ? String(x.monthly_fee) : '', method: 'cash', note: '' });
  const [st, setSt] = useState({ busy: false, err: '' });
  async function submit(e) {
    e.preventDefault();
    const amount = Math.round(Number(f.amount));
    if (!Number.isFinite(amount) || amount <= 0) return setSt({ busy: false, err: 'Summani kiriting.' });
    setSt({ busy: true, err: '' });
    const { error } = await supabase.rpc('record_payment', { p_enrollment: x.id, p_period: f.period, p_amount: amount, p_method: f.method, p_note: f.note.trim() || null });
    if (error) return setSt({ busy: false, err: rpcMsg(error) });
    onDone();
  }
  return (
    <form className="subform" onSubmit={submit}>
      <b>{x.full_name}: to'lovni qabul qilish</b>
      <div className="fgrid2">
        <label>Qaysi oy uchun
          <select value={f.period} onChange={(e) => setF({ ...f, period: e.target.value })}>
            {months.map((m) => <option key={m} value={m}>{fmtMonth(m)}</option>)}
          </select>
        </label>
        <label>Summa (so'm)<input value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} type="number" min="0" step="1000" /></label>
        <label>To'lov usuli
          <select value={f.method} onChange={(e) => setF({ ...f, method: e.target.value })}>
            {Object.entries(PAY_METHOD).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label>Izoh (ixtiyoriy)<input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} maxLength={300} /></label>
      </div>
      <div className="row" style={{ justifyContent: 'flex-start' }}>
        <button className="btn sm" disabled={st.busy}>To'langan deb belgilash</button>
        <button type="button" className="btn ghost sm" onClick={onCancel}>Bekor qilish</button>
      </div>
      {st.err ? <div className="formmsg err">{st.err}</div> : null}
    </form>
  );
}
