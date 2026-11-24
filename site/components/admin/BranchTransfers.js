'use client';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { rpcMsg, fmtDay } from '../../lib/auth';
import { tel } from '../../lib/cats';

const TABS = [['pending', 'Yangi'], ['approved', 'Tasdiqlangan'], ['rejected', 'Rad etilgan'], ['cancelled', 'Bekor qilingan'], ['', 'Barchasi']];
const ST = { pending: "Ko'rib chiqilmoqda", approved: 'Tasdiqlangan', rejected: 'Rad etilgan', cancelled: 'Bekor qilingan' };
const addr = (d, a) => [d, a].filter(Boolean).join(', ') || "Belgilanmagan";
const fmtTime = (t) => new Date(t).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

// Bosh admin: o'quvchilarning boshqa filialga ko'chish arizalari
export default function BranchTransfers() {
  const [tab, setTab] = useState('pending');
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState('');
  const [note, setNote] = useState({});
  const [busy, setBusy] = useState(0);

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc('admin_branch_transfers', { p_status: tab || null });
    if (error) { setErr(rpcMsg(error, "Arizalarni yuklab bo'lmadi.")); setRows([]); return; }
    setErr(''); setRows(data || []);
  }, [tab]);
  useEffect(() => { setRows(null); load(); }, [load]);

  async function decide(r, approve) {
    if (!approve && !(note[r.id] || '').trim()) { setErr("Rad etishda sababini yozing — u o'quvchiga yuboriladi."); return; }
    setBusy(r.id); setErr('');
    const { error } = await supabase.rpc('admin_decide_branch_transfer', { p_id: r.id, p_approve: approve, p_note: (note[r.id] || '').trim() || null });
    setBusy(0);
    if (error) { setErr(rpcMsg(error, "Saqlab bo'lmadi.")); return; }
    try { window.dispatchEvent(new Event('es-admin-counts')); } catch {}
    load();
  }

  return (
    <>
      <div className="tabs">
        {TABS.map(([k, v]) => <button key={k || 'all'} type="button" className={'tab' + (tab === k ? ' on' : '')} onClick={() => setTab(k)}>{v}</button>)}
      </div>
      {err ? <div className="formmsg err" style={{ marginBottom: 12 }} role="alert">{err}</div> : null}
      {rows === null ? <div className="card muted">Yuklanmoqda...</div> : !rows.length ? (
        <div className="card muted">{tab === 'pending' ? "Yangi ko'chirish arizalari yo'q." : "Bu bo'limda ariza yo'q."}</div>
      ) : (
        <div className="btr-list">
          {rows.map((r) => (
            <section key={r.id} className="card btr-card">
              <header>
                <div>
                  <b>{r.full_name}</b>
                  <small className="muted">{`${r.center_name} · ${r.course_name || 'kurs'}${r.group_name ? ' · ' + r.group_name : ''}`}</small>
                </div>
                <span className={'pillst ' + (r.status === 'pending' ? 'pending' : r.status === 'approved' ? '' : 'rejected')}>{ST[r.status]}</span>
              </header>
              <div className="btr-move">
                <div><small className="muted">Hozirgi filial</small><span>{addr(r.from_district, r.from_address)}</span></div>
                <i aria-hidden="true">→</i>
                <div><small className="muted">Yangi filial</small><b>{addr(r.to_district, r.to_address)}</b></div>
              </div>
              <dl className="csu-sum">
                <dt>Telefon</dt><dd><a href={tel(r.phone)}>{r.phone}</a>{r.login ? ` · login: ${r.login}` : ''}</dd>
                {r.wanted_from ? <><dt>Qachondan</dt><dd>{fmtDay(r.wanted_from)}</dd></> : null}
                {r.reason ? <><dt>Sababi</dt><dd>{r.reason}</dd></> : null}
                <dt>Yuborilgan</dt><dd>{fmtTime(r.created_at)}</dd>
                {r.decided_at ? <><dt>Ko'rib chiqilgan</dt><dd>{fmtTime(r.decided_at)}</dd></> : null}
                {r.admin_note ? <><dt>Izoh</dt><dd>{r.admin_note}</dd></> : null}
                {r.enrollment_status !== 'active' ? <><dt>Diqqat</dt><dd className="bad">O'quvchi bu kursda endi o'qimayapti</dd></> : null}
              </dl>
              {r.status === 'pending' ? (
                <div className="btr-act">
                  <input placeholder="Izoh (o'quvchiga yuboriladi; rad etishda majburiy)" maxLength={500} value={note[r.id] || ''} onChange={(e) => setNote((n) => ({ ...n, [r.id]: e.target.value }))} />
                  <div className="row" style={{ justifyContent: 'flex-start' }}>
                    <button type="button" className="btn sm" disabled={busy === r.id} onClick={() => decide(r, true)}>Tasdiqlash va ko'chirish</button>
                    <button type="button" className="btn ghost sm" disabled={busy === r.id} onClick={() => decide(r, false)}>Rad etish</button>
                  </div>
                </div>
              ) : null}
            </section>
          ))}
        </div>
      )}
    </>
  );
}
