'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { tel } from '../../lib/cats';
import { rpcMsg, fmtDay, APP_STATUS } from '../../lib/auth';

const TABS = [['new', 'Yangi'], ['contacted', "Bog'lanildi"], ['accepted', 'Qabul qilingan'], ['rejected', 'Rad etilgan'], ['', 'Barchasi']];
const csvCell = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
const today = () => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`; };
const fmtDT = (d) => { const t = new Date(d); if (isNaN(t)) return ''; const p = (n) => String(n).padStart(2, '0'); return `${fmtDay(d)} ${p(t.getHours())}:${p(t.getMinutes())}`; };

// O'qishga arizalar: markaz paneli (centerId berilganda) va bosh admin paneli (barcha markazlar) uchun
export default function Applications({ centerId = null, onChange }) {
  const [tab, setTab] = useState('new');
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState('');
  const [open, setOpen] = useState(null); // { id, mode: 'accept' | 'reject' }

  const load = useCallback(async () => {
    setErr('');
    let q = supabase.from('applications').select('id,center_id,course_id,course_name,full_name,phone,note,status,reply,source,tg_id,created_at,centers(name)');
    if (centerId) q = q.eq('center_id', centerId);
    if (tab) q = q.eq('status', tab);
    const { data, error } = await q.order('created_at', { ascending: false }).limit(500);
    if (error) { setErr("Arizalarni yuklab bo'lmadi."); setRows([]); return; }
    setRows(data || []);
  }, [centerId, tab]);
  useEffect(() => { setRows(null); load(); }, [load]);

  const changed = () => { setOpen(null); load(); onChange?.(); try { window.dispatchEvent(new Event('es-admin-counts')); } catch { /* muhim emas */ } };

  async function setStatus(id, status, reply = null) {
    const { error } = await supabase.rpc('set_application_status', { p_id: id, p_status: status, p_reply: reply });
    if (error) return setErr(rpcMsg(error));
    changed();
  }

  function exportCsv() {
    const head = ['Sana', 'Markaz', 'Ism familiya', 'Telefon', 'Kurs', 'Izoh', 'Holat', 'Manba'];
    const lines = [head.map(csvCell).join(','), ...(rows || []).map((r) => [fmtDT(r.created_at), r.centers?.name, r.full_name, r.phone, r.course_name, r.note, APP_STATUS[r.status], r.source === 'telegram' ? 'Telegram bot' : 'Sayt'].map(csvCell).join(','))];
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `arizalar-${today()}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  const cols = centerId ? 6 : 7;
  return (
    <>
      <div className="row" style={{ marginBottom: 12 }}>
        <div className="tabs" style={{ marginBottom: 0 }}>{TABS.map(([k, v]) => <button key={k || 'all'} type="button" className={'tab' + (tab === k ? ' on' : '')} onClick={() => setTab(k)}>{v}</button>)}</div>
        <button type="button" className="btn ghost sm" onClick={exportCsv} disabled={!rows || !rows.length}>CSV yuklab olish</button>
      </div>
      {err ? <div className="formmsg err" style={{ marginBottom: 12 }}>{err}</div> : null}
      {rows === null ? <div className="card muted">Yuklanmoqda...</div> : !rows.length ? (
        <div className="card muted">Bu bo'limda ariza yo'q.</div>
      ) : (
        <div className="card ascroll" style={{ padding: 0 }}>
          <table className="atable">
            <thead><tr><th>Sana</th>{centerId ? null : <th>Markaz</th>}<th>Ism familiya</th><th>Telefon</th><th>Kurs / izoh</th><th>Holat</th><th /></tr></thead>
            <tbody>
              {rows.map((r) => (
                <Row key={r.id} r={r} cols={cols} showCenter={!centerId} open={open?.id === r.id ? open.mode : ''}
                  onOpen={(mode) => setOpen(mode ? { id: r.id, mode } : null)} onStatus={setStatus} onDone={changed} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function Row({ r, cols, showCenter, open, onOpen, onStatus, onDone }) {
  const s = r.status;
  return (
    <>
      <tr className={s === 'new' ? 'new' : ''}>
        <td style={{ whiteSpace: 'nowrap' }}>{fmtDT(r.created_at)}</td>
        {showCenter ? <td><Link className="ok" href={`/centers/${r.center_id}`} target="_blank">{r.centers?.name}</Link></td> : null}
        <td>{r.full_name}{r.source === 'telegram' ? <div><span className="pillst contacted" title="Telegram bot orqali yuborilgan">🤖 Telegram bot</span></div> : null}</td>
        <td style={{ whiteSpace: 'nowrap' }}><a className="ok" href={tel(r.phone)}>{r.phone}</a></td>
        <td>{r.course_name ? <b>{r.course_name}</b> : <span className="muted">Kurs ko'rsatilmagan</span>}{r.note ? <div className="muted" style={{ marginTop: 2 }}>{r.note}</div> : null}{s === 'rejected' && r.reply ? <div className="muted" style={{ marginTop: 2 }}>Sabab: {r.reply}</div> : null}</td>
        <td><span className={'pillst ' + s}>{s === 'new' ? 'Yangi' : APP_STATUS[s]}</span></td>
        <td>
          <div className="acts">
            {s === 'new' ? <button type="button" className="btn ghost sm" onClick={() => onStatus(r.id, 'contacted')}>Bog'lanildi</button> : null}
            {s === 'new' || s === 'contacted' || s === 'rejected' ? <button type="button" className="btn sm" onClick={() => onOpen(open === 'accept' ? '' : 'accept')}>Qabul qilish</button> : null}
            {s === 'new' || s === 'contacted' ? <button type="button" className="btn ghost sm" onClick={() => onOpen(open === 'reject' ? '' : 'reject')}>Rad etish</button> : null}
            {s === 'contacted' || s === 'rejected' ? <button type="button" className="btn ghost sm" onClick={() => onStatus(r.id, 'new')}>Qaytarish</button> : null}
            {s === 'accepted' ? <span className="muted" style={{ fontSize: 13 }}>O'quvchilar ro'yxatida</span> : null}
          </div>
        </td>
      </tr>
      {open === 'accept' ? <tr><td colSpan={cols}><AcceptForm r={r} onDone={onDone} onCancel={() => onOpen('')} /></td></tr> : null}
      {open === 'reject' ? <tr><td colSpan={cols}><RejectForm r={r} onStatus={onStatus} onCancel={() => onOpen('')} /></td></tr> : null}
    </>
  );
}

// Qabul qilish: kursga bog'lash va o'qiyotganlar guruhiga qo'shish
function AcceptForm({ r, onDone, onCancel }) {
  const [courses, setCourses] = useState(null);
  const [f, setF] = useState({ course: r.course_id || '', group: '', fee: '', start: today() });
  const [st, setSt] = useState({ busy: false, err: '' });

  useEffect(() => {
    supabase.from('courses').select('id,name,price_monthly').eq('center_id', r.center_id).order('name').then(({ data }) => {
      const list = data || [];
      setCourses(list);
      const cur = list.find((k) => k.id === r.course_id);
      setF((x) => ({ ...x, course: cur ? cur.id : '', fee: cur?.price_monthly ? String(cur.price_monthly) : x.fee }));
    });
  }, [r.center_id, r.course_id]);

  const pick = (e) => {
    const k = (courses || []).find((x) => x.id === e.target.value);
    setF((x) => ({ ...x, course: e.target.value, fee: k?.price_monthly ? String(k.price_monthly) : x.fee }));
  };

  async function submit(e) {
    e.preventDefault();
    const fee = f.fee === '' ? null : Math.round(Number(f.fee));
    if (fee !== null && (!Number.isFinite(fee) || fee < 0)) return setSt({ busy: false, err: "Oylik to'lovni raqam bilan kiriting." });
    setSt({ busy: true, err: '' });
    const { error } = await supabase.rpc('accept_application', { p_id: r.id, p_course: f.course || null, p_group: f.group.trim() || null, p_fee: fee, p_start: f.start || null });
    if (error) return setSt({ busy: false, err: rpcMsg(error) });
    onDone();
  }

  return (
    <form className="subform" onSubmit={submit}>
      <b>{r.full_name}ni kursga qabul qilish</b>
      <div className="fgrid2">
        <label>Kurs
          <select value={f.course} onChange={pick} disabled={!courses}>
            <option value="">{r.course_name && !r.course_id ? r.course_name : "Kurs tanlanmagan"}</option>
            {(courses || []).map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
          </select>
        </label>
        <label>Guruh (ixtiyoriy)<input value={f.group} onChange={(e) => setF({ ...f, group: e.target.value })} maxLength={60} placeholder="Masalan: Du-Chor-Ju 18:00" /></label>
        <label>Oylik to'lov (so'm)<input value={f.fee} onChange={(e) => setF({ ...f, fee: e.target.value })} type="number" min="0" step="1000" placeholder="Masalan: 450000" /></label>
        <label>O'qish boshlanadigan sana<input value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} type="date" /></label>
      </div>
      <div className="row" style={{ justifyContent: 'flex-start' }}>
        <button className="btn sm" disabled={st.busy}>{st.busy ? 'Saqlanmoqda...' : "Qabul qilish va guruhga qo'shish"}</button>
        <button type="button" className="btn ghost sm" onClick={onCancel}>Bekor qilish</button>
      </div>
      {st.err ? <div className="formmsg err">{st.err}</div> : null}
    </form>
  );
}

function RejectForm({ r, onStatus, onCancel }) {
  const [reply, setReply] = useState('');
  return (
    <form className="subform" onSubmit={(e) => { e.preventDefault(); onStatus(r.id, 'rejected', reply.trim() || null); }}>
      <b>{r.full_name}ning arizasini rad etish</b>
      <label>Sabab (ixtiyoriy, arizachiga ko'rinadi)<input value={reply} onChange={(e) => setReply(e.target.value)} maxLength={500} placeholder="Masalan: guruhda joy qolmadi" /></label>
      <div className="row" style={{ justifyContent: 'flex-start' }}>
        <button className="btn danger sm">Rad etish</button>
        <button type="button" className="btn ghost sm" onClick={onCancel}>Bekor qilish</button>
      </div>
    </form>
  );
}
