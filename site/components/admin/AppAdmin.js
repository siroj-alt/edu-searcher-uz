'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { rpcMsg, fmtDay, APP_STATUS } from '../../lib/auth';
import { tel } from '../../lib/cats';

const TABS = [['umumiy', 'Umumiy'], ['natijalar', 'Natijalar'], ['sinov', 'Sinov darslari'], ['xabar', 'Xabar yuborish']];
const fmtTime = (t) => new Date(t).toLocaleString('ru-RU', { timeZone: 'Asia/Tashkent', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

// Bosh admin: ilova va kabinetdagi yangi imkoniyatlar
export default function AppAdmin() {
  const [tab, setTab] = useState('umumiy');
  const [s, setS] = useState(null);
  const [err, setErr] = useState('');
  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc('admin_app_stats');
    if (error) { setErr(rpcMsg(error, "Ma'lumotlarni yuklab bo'lmadi.")); return; }
    setErr(''); setS(data);
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <>
      <div className="tabs">
        {TABS.map(([k, v]) => (
          <button key={k} type="button" className={'tab' + (tab === k ? ' on' : '')} onClick={() => setTab(k)}>
            {v}{k === 'natijalar' && s?.results_pending ? <em className="tcnt">{s.results_pending}</em> : null}
          </button>
        ))}
      </div>
      {err ? <div className="formmsg err" style={{ marginBottom: 12 }} role="alert">{err}</div> : null}
      {tab === 'umumiy' ? <Overview s={s} /> : null}
      {tab === 'natijalar' ? <Results onChange={load} /> : null}
      {tab === 'sinov' ? <Trials s={s} /> : null}
      {tab === 'xabar' ? <Broadcast s={s} /> : null}
    </>
  );
}

function Overview({ s }) {
  if (!s) return <div className="card muted">Yuklanmoqda...</div>;
  const tiles = [
    ['Foydalanuvchilar', s.users], ["O'quvchi hisoblari", s.students], ['Ota-ona hisoblari', s.parents], ['Bog\'langan oilalar', s.family_links],
    ['Taklif orqali kelganlar', s.referred], ['Sinov darslari (30 kun)', s.trials_30], ['Kutilayotgan sinov darslari', s.trials_upcoming],
    ['Tasdiqlangan natijalar', s.results_approved], ['Tekshiruvdagi natijalar', s.results_pending], ['Ustozlar profillari', s.teachers],
    ['Chegirma bergan markazlar', s.discount_centers], ['Davomat belgilari (30 kun)', s.attendance_30], ['Uy vazifalari (30 kun)', s.homework_30],
    ['Yuborilgan xabarlar (7 kun)', s.notif_7]
  ];
  return (
    <>
      <div className="appadm-grid">
        {tiles.map(([l, v]) => <div key={l} className="card stat"><b>{Number(v || 0).toLocaleString('ru-RU')}</b><span>{l}</span></div>)}
      </div>
      <div className="sec" style={{ marginTop: 20 }}><h2>Eng faol taklif qiluvchilar</h2><i /></div>
      {s.top_referrers?.length ? (
        <div className="card">
          {s.top_referrers.map((r) => <div key={r.code} className="crow"><span><b>{r.name || '—'}</b> <small className="muted">kod {r.code}</small></span><b>{r.invited} kishi</b></div>)}
        </div>
      ) : <div className="card muted">Hali hech kim taklif kodi orqali ro'yxatdan o'tmagan.</div>}
    </>
  );
}

function Results({ onChange }) {
  const [st, setSt] = useState('pending');
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(0);
  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc('admin_results', { p_status: st });
    if (error) { setErr(rpcMsg(error, "Natijalarni yuklab bo'lmadi.")); setRows([]); return; }
    setErr(''); setRows(data || []);
  }, [st]);
  useEffect(() => { setRows(null); load(); }, [load]);
  async function decide(r, status) {
    setBusy(r.id);
    const { error } = await supabase.rpc('set_result_status', { p_id: r.id, p_status: status });
    setBusy(0);
    if (error) return setErr(rpcMsg(error, "Saqlab bo'lmadi."));
    try { window.dispatchEvent(new Event('es-admin-counts')); } catch {}
    load(); onChange();
  }
  return (
    <>
      <p className="muted" style={{ marginBottom: 10 }}>O'quvchilar o'qigan markazi sahifasidagi «Natijalar devori»ga qo'shgan natijalar. Odatda markazning o'zi tasdiqlaydi; markaz kabineti bo'lmasa yoki shubhali natija bo'lsa — shu yerda tekshiring.</p>
      <div className="tabs chips">
        {[['pending', 'Tekshiruvda'], ['approved', 'Tasdiqlangan'], ['rejected', 'Rad etilgan'], ['all', 'Barchasi']].map(([k, v]) => (
          <button key={k} type="button" className={'tab' + (st === k ? ' on' : '')} onClick={() => setSt(k)}>{v}</button>
        ))}
      </div>
      {err ? <div className="formmsg err" style={{ marginBottom: 12 }}>{err}</div> : null}
      {rows === null ? <div className="card muted">Yuklanmoqda...</div> : !rows.length ? <div className="card muted">Bu bo'limda natija yo'q.</div> : (
        <div className="resw">
          {rows.map((r) => (
            <div key={r.id} className="card resw-i">
              {r.photo_url ? <a href={r.photo_url} target="_blank" rel="noopener noreferrer"><img src={r.photo_url} alt="Sertifikat" loading="lazy" /></a> : <small className="muted">Sertifikat rasmi yo'q</small>}
              <span className="resw-s"><small>{r.exam}</small><b>{r.score}</b></span>
              <b>{r.student_name}</b>
              <Link href={`/centers/${r.center_id}`} className="muted" style={{ fontSize: 13 }}>{r.center}</Link>
              <small className="muted">{fmtDay(r.created_at)}</small>
              {r.status === 'pending' ? (
                <div className="row" style={{ gap: 6, justifyContent: 'flex-start' }}>
                  <button type="button" className="btn sm" disabled={busy === r.id} onClick={() => decide(r, 'approved')}>Tasdiqlash</button>
                  <button type="button" className="btn ghost sm" disabled={busy === r.id} onClick={() => decide(r, 'rejected')}>Rad etish</button>
                </div>
              ) : <span className={'pillst ' + (r.status === 'approved' ? '' : 'rejected')}>{r.status === 'approved' ? 'Tasdiqlangan' : 'Rad etilgan'}</span>}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function Trials({ s }) {
  if (!s) return <div className="card muted">Yuklanmoqda...</div>;
  if (!s.trials?.length) return <div className="card muted">Hali bepul sinov darsiga yozilganlar yo'q. Yozilganlar markaz paneliga va «Arizalar» bo'limiga ham tushadi.</div>;
  const now = Date.now();
  return (
    <div className="card">
      {s.trials.map((t) => (
        <div key={t.id} className="crow trial-row">
          <span>
            <b>{fmtTime(t.trial_at)}</b>{new Date(t.trial_at).getTime() > now ? <small className="ok"> · kutilmoqda</small> : null}
            <br /><small className="muted">{t.center} · {t.name} · <a href={tel(t.phone)}>{t.phone}</a>{t.code ? ` · ${t.code}` : ''}</small>
          </span>
          <span className={'pillst ' + t.status}>{APP_STATUS[t.status] || t.status}</span>
        </div>
      ))}
    </div>
  );
}

function Broadcast({ s }) {
  const [f, setF] = useState({ title: '', body: '', target: 'all' });
  const [st, setSt] = useState({ busy: false, err: '', ok: '' });
  const count = s ? (f.target === 'all' ? s.users : f.target === 'parent' ? s.parents : s.students) : null;
  async function send(e) {
    e.preventDefault();
    if (f.title.trim().length < 3) return setSt({ busy: false, err: 'Sarlavhani yozing.', ok: '' });
    if (!confirm(`Xabar ${count ?? ''} ta foydalanuvchiga yuboriladi (kabinet, ilova va Telegram). Davom etamizmi?`)) return;
    setSt({ busy: true, err: '', ok: '' });
    const { data, error } = await supabase.rpc('admin_broadcast', { p_title: f.title.trim(), p_body: f.body.trim(), p_target: f.target });
    if (error) return setSt({ busy: false, err: rpcMsg(error, 'Yuborilmadi.'), ok: '' });
    setF({ title: '', body: '', target: f.target });
    setSt({ busy: false, err: '', ok: `Yuborildi: ${data} ta foydalanuvchi.` });
  }
  return (
    <form className="card stack" onSubmit={send} style={{ maxWidth: 640 }}>
      <b>Barcha foydalanuvchilarga xabar</b>
      <p className="muted" style={{ fontSize: 14 }}>Xabar kabinetdagi «Xabarlar» bo'limida va ilovada ko'rinadi; Telegram botni ulaganlarga bot orqali ham boradi. Reklama emas, foydali yangiliklar uchun ishlating.</p>
      <label>Kimga
        <select value={f.target} onChange={(e) => setF({ ...f, target: e.target.value })}>
          <option value="all">Hammaga{s ? ` (${s.users})` : ''}</option>
          <option value="student">Faqat o'quvchilarga{s ? ` (${s.students})` : ''}</option>
          <option value="parent">Faqat ota-onalarga{s ? ` (${s.parents})` : ''}</option>
        </select>
      </label>
      <label>Sarlavha<input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} maxLength={120} placeholder="Masalan: Yangi markazlar qo'shildi" /></label>
      <label>Matn (ixtiyoriy)<textarea value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} maxLength={600} rows={4} /></label>
      <button className="btn" disabled={st.busy}>{st.busy ? 'Yuborilmoqda...' : 'Yuborish'}</button>
      {st.err ? <div className="formmsg err">{st.err}</div> : null}
      {st.ok ? <div className="formmsg ok">{st.ok}</div> : null}
    </form>
  );
}
