'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { rpcMsg, fmtDay } from '../../lib/auth';

const ST = [['present', 'Keldi'], ['late', 'Kechikdi'], ['absent', 'Kelmadi'], ['excused', 'Sababli']];
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

// O'quvchi kundaligi: davomat (o'quvchi va ota-onasi ilovada ko'radi; kelmasa ota-onaga xabar boradi)
// va guruhga uy vazifasi (o'quvchilarga ilova va Telegram orqali bildirishnoma).
export default function Diary({ centerId }) {
  const [rows, setRows] = useState(null);
  const [att, setAtt] = useState({});
  const [hw, setHw] = useState([]);
  const [group, setGroup] = useState('');
  const [date, setDate] = useState(today());
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [f, setF] = useState({ title: '', details: '', due: '' });

  const load = useCallback(async () => {
    const [e, h] = await Promise.all([
      supabase.from('enrollments').select('id,course_id,course_name,group_name,full_name,status').eq('center_id', centerId).eq('status', 'active').order('course_name').order('full_name').limit(2000),
      supabase.from('homework').select('id,title,details,due_on,course_id,group_name,created_at').eq('center_id', centerId).order('created_at', { ascending: false }).limit(30)
    ]);
    if (e.error) { setErr("O'quvchilarni yuklab bo'lmadi."); setRows([]); return; }
    setErr(''); setRows(e.data || []); setHw(h.data || []);
  }, [centerId]);
  useEffect(() => { setRows(null); load(); }, [load]);

  const groups = useMemo(() => {
    const m = new Map();
    for (const x of rows || []) {
      const k = (x.course_id || '') + '|' + (x.group_name || '');
      if (!m.has(k)) m.set(k, { key: k, course_id: x.course_id, group_name: x.group_name, label: (x.course_name || 'Kurs') + (x.group_name ? ' · ' + x.group_name : ''), list: [] });
      m.get(k).list.push(x);
    }
    return [...m.values()];
  }, [rows]);
  const g = groups.find((x) => x.key === group) || groups[0];

  // Tanlangan sana bo'yicha davomat
  useEffect(() => {
    if (!g) return;
    const ids = g.list.map((x) => x.id);
    supabase.from('attendance').select('enrollment_id,status,grade').in('enrollment_id', ids).eq('lesson_date', date)
      .then(({ data }) => setAtt(Object.fromEntries((data || []).map((a) => [a.enrollment_id, a]))));
  }, [g?.key, date]); // eslint-disable-line react-hooks/exhaustive-deps

  async function mark(id, status, grade) {
    setBusy(id + status);
    const { error } = await supabase.rpc('center_mark_attendance', { p_enrollment: id, p_date: date, p_status: status, p_grade: grade || null, p_note: null });
    setBusy('');
    if (error) return setErr(rpcMsg(error));
    setErr('');
    setAtt((a) => ({ ...a, [id]: { enrollment_id: id, status, grade: grade || null } }));
  }
  async function allPresent() {
    for (const x of g.list) if (!att[x.id]) await mark(x.id, 'present');
  }
  async function addHw(e) {
    e.preventDefault();
    if (f.title.trim().length < 2) return setErr('Vazifa nomini yozing.');
    setBusy('hw');
    const { error } = await supabase.rpc('center_add_homework', { p_center: centerId, p_course: g?.course_id || null, p_group: g?.group_name || null, p_enrollment: null, p_title: f.title.trim(), p_details: f.details.trim() || null, p_due: f.due || null });
    setBusy('');
    if (error) return setErr(rpcMsg(error));
    setErr(''); setMsg("Uy vazifasi qo'shildi. Guruh o'quvchilariga xabar yuborildi."); setF({ title: '', details: '', due: '' });
    load();
  }

  if (rows === null) return <div className="card muted">Yuklanmoqda...</div>;
  if (!groups.length) return <div className="card muted">Hali faol o'quvchi yo'q. Arizani qabul qilsangiz, o'quvchi shu yerda paydo bo'ladi.</div>;
  return (
    <>
      {err ? <div className="formmsg err" style={{ marginBottom: 12 }}>{err}</div> : null}
      {msg ? <div className="formmsg ok" style={{ marginBottom: 12 }}>{msg}</div> : null}
      <div className="card stack">
        <div className="row" style={{ gap: 10, flexWrap: 'wrap', justifyContent: 'flex-start' }}>
          <label style={{ flex: '1 1 240px' }}>Guruh
            <select value={g.key} onChange={(e) => setGroup(e.target.value)}>
              {groups.map((x) => <option key={x.key} value={x.key}>{x.label} ({x.list.length})</option>)}
            </select>
          </label>
          <label style={{ flex: '0 1 180px' }}>Dars sanasi<input type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value || today())} /></label>
        </div>
        <p className="muted small" style={{ margin: 0 }}>O'quvchi va unga bog'langan ota-ona davomatni EduSearcher ilovasida ko'radi. «Kelmadi» belgilansa, ota-onaga darhol xabar boradi.</p>
      </div>

      <div className="sec" style={{ margin: '22px 0 10px' }}><h2 style={{ fontSize: 19 }}>Davomat: {fmtDay(date)}</h2><i /><button type="button" className="btn ghost sm" onClick={allPresent} disabled={!!busy}>Hammasi keldi</button></div>
      <div className="card ascroll" style={{ padding: 0 }}>
        <table className="atable">
          <thead><tr><th>O'quvchi</th><th>Holat</th><th>Baho</th></tr></thead>
          <tbody>
            {g.list.map((x) => {
              const a = att[x.id];
              return (
                <tr key={x.id}>
                  <td><b>{x.full_name}</b></td>
                  <td>
                    <div className="acts">
                      {ST.map(([k, v]) => (
                        <button key={k} type="button" className={'btn sm' + (a?.status === k ? '' : ' ghost')} disabled={busy === x.id + k} onClick={() => mark(x.id, k, a?.grade)}>{v}</button>
                      ))}
                    </div>
                  </td>
                  <td>
                    <select value={a?.grade || ''} disabled={!a || a.status === 'absent'} onChange={(e) => mark(x.id, a.status, Number(e.target.value) || null)} aria-label="Baho">
                      <option value="">—</option>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="sec" style={{ margin: '26px 0 10px' }}><h2 style={{ fontSize: 19 }}>Uy vazifasi: {g.label}</h2><i /></div>
      <form className="card stack" onSubmit={addHw}>
        <label>Vazifa<input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} maxLength={120} placeholder="Masalan: Unit 5, 1–4-mashqlar" /></label>
        <label>Izoh (ixtiyoriy)<textarea rows={3} value={f.details} onChange={(e) => setF({ ...f, details: e.target.value })} maxLength={1500} /></label>
        <label style={{ maxWidth: 220 }}>Muddat<input type="date" value={f.due} min={today()} onChange={(e) => setF({ ...f, due: e.target.value })} /></label>
        <div className="row" style={{ justifyContent: 'flex-start' }}><button className="btn sm" disabled={busy === 'hw'}>Guruhga yuborish</button></div>
      </form>
      {hw.length ? (
        <div className="card ascroll" style={{ padding: 0, marginTop: 12 }}>
          <table className="atable">
            <thead><tr><th>Vazifa</th><th>Guruh</th><th>Muddat</th><th>Berilgan</th></tr></thead>
            <tbody>
              {hw.map((h) => (
                <tr key={h.id}>
                  <td><b>{h.title}</b>{h.details ? <div className="muted small">{h.details}</div> : null}</td>
                  <td className="small">{groups.find((x) => (x.course_id || '') === (h.course_id || '') && (x.group_name || '') === (h.group_name || ''))?.label || 'Barcha guruhlar'}</td>
                  <td>{h.due_on ? fmtDay(h.due_on) : '—'}</td>
                  <td>{fmtDay(h.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </>
  );
}
