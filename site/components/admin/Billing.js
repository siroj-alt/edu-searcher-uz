'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { rpcMsg } from '../../lib/auth';

const fmt = (n) => Math.round(Number(n) || 0).toLocaleString('ru-RU');
const csvCell = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
const STATE = { ok: 'Hisobga kiradi', rad: "O'quvchi «yozilmadim» dedi", qisqa: "14 kun ichida tashladi" };
const monthOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const fmtD = (d) => (d ? new Date(d).toLocaleDateString('ru-RU') : '');

// Bosh admin: oylik hisob — markazlar kesimida tasdiqlangan o'quvchilar va summa
export default function Billing() {
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const [month, setMonth] = useState(monthOf(prev));
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [open, setOpen] = useState({});

  useEffect(() => {
    let live = true;
    setData(null); setErr('');
    supabase.rpc('admin_billing', { p_month: month + '-01' }).then(({ data: d, error }) => {
      if (!live) return;
      if (error) { setErr(rpcMsg(error, "Hisobni yuklab bo'lmadi.")); setData({ centers: [], total: 0 }); return; }
      setData(d);
    });
    return () => { live = false; };
  }, [month]);

  function exportCsv() {
    const head = ['Markaz', 'Ariza raqami', "O'quvchi", 'Kurs', 'Boshlagan', 'Oylik narx', 'Holat', 'Summa', 'Sinov davri'];
    const lines = [head.map(csvCell).join(',')];
    for (const c of data.centers || []) for (const it of c.items || []) {
      lines.push([c.name, it.code, it.name, it.course, fmtD(it.start), it.fee || '', STATE[it.state] || it.state, it.state === 'ok' ? it.amount : 0, c.trial ? 'ha' : "yo'q"].map(csvCell).join(','));
    }
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `hisob-${month}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  const centers = data?.centers || [];
  const billable = centers.filter((c) => !c.trial).reduce((s, c) => s + Number(c.amount || 0), 0);
  const stat = (n, l) => <div className="card" style={{ flex: '1 1 160px' }}><div style={{ fontSize: 24, fontWeight: 700 }}>{n}</div><div className="muted">{l}</div></div>;
  return (
    <>
      <div className="row" style={{ gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <label className="muted" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>Oy
          <input type="month" value={month} max={monthOf(now)} onChange={(e) => e.target.value && setMonth(e.target.value)} />
        </label>
        <button type="button" className="btn ghost sm" onClick={exportCsv} disabled={!centers.length}>CSV yuklab olish</button>
      </div>
      {err ? <div className="formmsg err" style={{ marginBottom: 12 }} role="alert">{err}</div> : null}
      {!data ? <div className="card muted">Yuklanmoqda...</div> : (
        <>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
            {stat(fmt(billable) + " so'm", "To'lanadigan summa (sinov davridan tashqari)")}
            {stat(fmt(data.total) + " so'm", 'Jami, sinov davri bilan')}
            {stat(centers.reduce((s, c) => s + Number(c.ok_count || 0), 0), "Tasdiqlangan o'quvchilar")}
            {stat(`${Math.round(Number(data.rate || 0) * 100)}% / ${fmt(data.flat)}`, "Tarif: birinchi oydan ulush / narx yo'q bo'lsa")}
          </div>
          {!centers.length ? <div className="card muted">Bu oyda sayt orqali o'qishni boshlagan o'quvchi yo'q.</div> : (
            <div className="card ascroll" style={{ padding: 0 }}>
              <table className="atable">
                <thead><tr><th>Markaz</th><th>O'quvchilar</th><th>Hisobga kirmagan</th><th>Summa</th><th>Holat</th><th /></tr></thead>
                <tbody>
                  {centers.map((c) => (
                    <FragmentRow key={c.id} c={c} open={!!open[c.id]} onToggle={() => setOpen((o) => ({ ...o, [c.id]: !o[c.id] }))} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  );
}

function FragmentRow({ c, open, onToggle }) {
  return (
    <>
      <tr>
        <td><a href={`/centers/${c.id}`} target="_blank" rel="noreferrer">{c.name}</a></td>
        <td>{c.ok_count}</td>
        <td>{c.skipped || 0}</td>
        <td style={{ whiteSpace: 'nowrap' }}><b>{fmt(c.amount)} so'm</b></td>
        <td>{c.trial ? <span className="bill-tag trial">Sinov davri</span> : <span className="bill-tag">To'lanadi</span>}</td>
        <td><button type="button" className="btn ghost sm" onClick={onToggle} aria-expanded={open}>{open ? 'Yopish' : "O'quvchilar"}</button></td>
      </tr>
      {open ? (
        <tr className="bill-items">
          <td colSpan={6}>
            <ul>
              {(c.items || []).map((it) => (
                <li key={it.code + it.start} className={it.state === 'ok' ? '' : 'off'}>
                  <code>{it.code}</code>
                  <span>{it.name}{it.course ? ` · ${it.course}` : ''}</span>
                  <span className="muted">{fmtD(it.start)}{it.fee ? ` · ${fmt(it.fee)} so'm/oy` : ''}</span>
                  <span>{it.state === 'ok' ? `${fmt(it.amount)} so'm` : STATE[it.state]}</span>
                  <span className="muted">{it.confirmed === true ? "O'quvchi tasdiqladi" : it.confirmed === false ? "O'quvchi rad etdi" : 'Javob kutilmoqda'}</span>
                </li>
              ))}
            </ul>
          </td>
        </tr>
      ) : null}
    </>
  );
}
