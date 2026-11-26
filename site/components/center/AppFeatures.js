'use client';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { rpcMsg, fmtDay } from '../../lib/auth';

const WD = ['', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba'];

// EduSearcher ilovasidagi imkoniyatlar uchun markaz sozlamalari:
// ilova orqali chegirma, ustozlar, bepul sinov darsi vaqtlari, o'quvchilar natijalarini tasdiqlash.
export default function AppFeatures({ center, onChange }) {
  const cid = center.id;
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [disc, setDisc] = useState(String(center.app_discount || ''));
  const [teachers, setTeachers] = useState(null);
  const [slots, setSlots] = useState([]);
  const [results, setResults] = useState([]);
  const [t, setT] = useState({ full_name: '', subject: '', experience_years: '', certificate: '', bio: '', photo_url: '', video_url: '' });
  const [s, setS] = useState({ weekday: '6', at: '10:00' });
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    const [a, b, r, c] = await Promise.all([
      supabase.from('center_teachers').select('*').eq('center_id', cid).order('sort').order('created_at'),
      supabase.from('center_trial_slots').select('id,weekday,at').eq('center_id', cid).order('weekday').order('at'),
      supabase.from('center_results').select('id,student_name,exam,score,photo_url,status,created_at').eq('center_id', cid).order('created_at', { ascending: false }).limit(100),
      supabase.from('centers').select('app_discount').eq('id', cid).maybeSingle()
    ]);
    setTeachers(a.data || []); setSlots(b.data || []); setResults(r.data || []);
    if (c.data) setDisc(String(c.data.app_discount || ''));
  }, [cid]);
  useEffect(() => { load(); }, [load]);
  const done = (m) => { setErr(''); setOk(m); setBusy(''); };
  const fail = (e) => { setOk(''); setErr(rpcMsg(e)); setBusy(''); };

  async function saveDisc(e) {
    e.preventDefault();
    const n = disc.trim() ? Math.round(Number(disc)) : 0;
    if (!(n >= 0 && n <= 50)) return setErr("Chegirma 0 dan 50 foizgacha bo'lishi kerak.");
    setBusy('disc');
    const { error } = await supabase.from('centers').update({ app_discount: n || null }).eq('id', cid);
    if (error) return fail(error);
    done(n ? `Ilova orqali yozilganlarga ${n}% chegirma ko'rsatiladi.` : "Chegirma o'chirildi."); onChange?.();
  }
  async function addTeacher(e) {
    e.preventDefault();
    if (t.full_name.trim().length < 2) return setErr("Ustoz ismini yozing.");
    if (t.photo_url && !/^https:\/\//.test(t.photo_url.trim())) return setErr("Rasm havolasi https:// bilan boshlansin.");
    if (t.video_url && !/^https:\/\//.test(t.video_url.trim())) return setErr("Video havolasi https:// bilan boshlansin.");
    setBusy('t');
    const { error } = await supabase.from('center_teachers').insert({
      center_id: cid, full_name: t.full_name.trim(), subject: t.subject.trim() || null,
      experience_years: t.experience_years ? Number(t.experience_years) : null, certificate: t.certificate.trim() || null,
      bio: t.bio.trim() || null, photo_url: t.photo_url.trim() || null, video_url: t.video_url.trim() || null, sort: (teachers || []).length
    });
    if (error) return fail(error);
    setT({ full_name: '', subject: '', experience_years: '', certificate: '', bio: '', photo_url: '', video_url: '' });
    done("Ustoz qo'shildi."); load();
  }
  async function delTeacher(id) {
    if (!window.confirm("Ustozni o'chirasizmi?")) return;
    const { error } = await supabase.from('center_teachers').delete().eq('id', id);
    if (error) return fail(error);
    load();
  }
  async function addSlot(e) {
    e.preventDefault();
    setBusy('s');
    const { error } = await supabase.from('center_trial_slots').insert({ center_id: cid, weekday: Number(s.weekday), at: s.at });
    if (error) return fail(error.code === '23505' ? { message: 'Bu vaqt allaqachon qo\'shilgan' } : error);
    done("Vaqt qo'shildi."); load();
  }
  async function delSlot(id) {
    const { error } = await supabase.from('center_trial_slots').delete().eq('id', id);
    if (error) return fail(error);
    load();
  }
  async function decide(id, status) {
    setBusy('r' + id);
    const { error } = await supabase.rpc('set_result_status', { p_id: id, p_status: status });
    if (error) return fail(error);
    done(status === 'approved' ? 'Natija devorga chiqdi.' : 'Natija rad etildi.'); load();
  }

  const pending = results.filter((r) => r.status === 'pending');
  return (
    <div className="cinfo">
      {err ? <div className="formmsg err">{err}</div> : null}
      {ok ? <div className="formmsg ok">{ok}</div> : null}

      <h2 className="cinfo-h">Natijalar devori{pending.length ? ` (${pending.length} ta yangi)` : ''}</h2>
      <div className="card stack">
        <p className="muted small" style={{ margin: 0 }}>O'quvchilaringiz ilovada IELTS, SAT, CEFR va boshqa natijalarini sertifikat rasmi bilan yuboradi. Tasdiqlaganingiz markaz sahifasidagi «Natijalar devori»da ko'rinadi.</p>
        {results.length ? (
          <div className="ascroll">
            <table className="atable">
              <thead><tr><th>O'quvchi</th><th>Imtihon</th><th>Ball</th><th>Sertifikat</th><th>Sana</th><th /></tr></thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id} className={r.status === 'pending' ? 'new' : ''}>
                    <td><b>{r.student_name}</b></td><td>{r.exam}</td><td><b>{r.score}</b></td>
                    <td>{r.photo_url ? <a className="ok" href={r.photo_url} target="_blank" rel="noopener noreferrer">Ko'rish</a> : <span className="muted">—</span>}</td>
                    <td>{fmtDay(r.created_at)}</td>
                    <td>
                      {r.status === 'pending' ? (
                        <div className="acts">
                          <button type="button" className="btn sm" disabled={busy === 'r' + r.id} onClick={() => decide(r.id, 'approved')}>Tasdiqlash</button>
                          <button type="button" className="btn ghost sm" disabled={busy === 'r' + r.id} onClick={() => decide(r.id, 'rejected')}>Rad etish</button>
                        </div>
                      ) : <span className={'pillst ' + (r.status === 'rejected' ? 'rejected' : '')}>{r.status === 'approved' ? 'Devorda' : 'Rad etilgan'}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="muted" style={{ margin: 0 }}>Hali natija yuborilmagan.</p>}
      </div>

      <h2 className="cinfo-h">Ilova orqali chegirma</h2>
      <form className="card stack" onSubmit={saveDisc}>
        <p className="muted small" style={{ margin: 0 }}>EduSearcher ilovasi orqali yozilgan o'quvchilarga birinchi oy uchun chegirma. Markaz kartasida «−N% ilovada» belgisi chiqadi — bu ko'proq ariza olib keladi. O'quvchi ariza raqamini (ES-...) aytadi.</p>
        <label style={{ maxWidth: 220 }}>Chegirma, %<input type="number" min={0} max={50} value={disc} onChange={(e) => setDisc(e.target.value)} placeholder="Masalan, 10" /></label>
        <div className="row" style={{ justifyContent: 'flex-start' }}><button className="btn sm" disabled={busy === 'disc'}>Saqlash</button></div>
      </form>

      <h2 className="cinfo-h">Bepul sinov darsi vaqtlari</h2>
      <div className="card stack">
        <p className="muted small" style={{ margin: 0 }}>Ilovada o'quvchi shu vaqtlardan birini tanlab sinov darsiga yoziladi va sizga ariza keladi. Vaqt kiritilmasa, Du–Sha kunlari 10:00, 14:00, 16:00, 18:00 taklif qilinadi.</p>
        {slots.length ? (
          <div className="row" style={{ flexWrap: 'wrap', gap: 8, justifyContent: 'flex-start' }}>
            {slots.map((x) => (
              <span key={x.id} className="pillst" style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                {WD[x.weekday]}, {String(x.at).slice(0, 5)}
                <button type="button" className="btn ghost sm" style={{ padding: '0 8px', minHeight: 24 }} onClick={() => delSlot(x.id)} aria-label="O'chirish">×</button>
              </span>
            ))}
          </div>
        ) : null}
        <form className="row" style={{ gap: 10, flexWrap: 'wrap', justifyContent: 'flex-start', alignItems: 'flex-end' }} onSubmit={addSlot}>
          <label>Kun<select value={s.weekday} onChange={(e) => setS({ ...s, weekday: e.target.value })}>{WD.slice(1).map((w, i) => <option key={w} value={i + 1}>{w}</option>)}</select></label>
          <label>Vaqt<input type="time" value={s.at} onChange={(e) => setS({ ...s, at: e.target.value })} required /></label>
          <button className="btn sm" disabled={busy === 's'}>Qo'shish</button>
        </form>
      </div>

      <h2 className="cinfo-h">Ustozlar</h2>
      <div className="card stack">
        {teachers === null ? <p className="muted">Yuklanmoqda...</p> : teachers.length ? (
          <div className="ascroll">
            <table className="atable">
              <thead><tr><th>Ism</th><th>Fan</th><th>Tajriba</th><th>Sertifikat</th><th /></tr></thead>
              <tbody>
                {teachers.map((x) => (
                  <tr key={x.id}>
                    <td><b>{x.full_name}</b>{x.bio ? <div className="muted small">{x.bio.slice(0, 120)}</div> : null}</td>
                    <td>{x.subject || '—'}</td><td>{x.experience_years != null ? `${x.experience_years} yil` : '—'}</td><td>{x.certificate || '—'}</td>
                    <td><button type="button" className="btn ghost sm" onClick={() => delTeacher(x.id)}>O'chirish</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="muted" style={{ margin: 0 }}>Ustozlar qo'shilmagan. Ota-onalar ustozni bilib tanlashni yoqtiradi.</p>}
        <form className="stack" onSubmit={addTeacher}>
          <div className="row" style={{ gap: 10, flexWrap: 'wrap', justifyContent: 'flex-start' }}>
            <label style={{ flex: '1 1 220px' }}>Ism familiya<input value={t.full_name} onChange={(e) => setT({ ...t, full_name: e.target.value })} maxLength={80} /></label>
            <label style={{ flex: '1 1 180px' }}>Fan<input value={t.subject} onChange={(e) => setT({ ...t, subject: e.target.value })} maxLength={80} placeholder="IELTS, matematika..." /></label>
            <label style={{ flex: '0 1 120px' }}>Tajriba (yil)<input type="number" min={0} max={60} value={t.experience_years} onChange={(e) => setT({ ...t, experience_years: e.target.value })} /></label>
            <label style={{ flex: '1 1 180px' }}>Sertifikat<input value={t.certificate} onChange={(e) => setT({ ...t, certificate: e.target.value })} maxLength={120} placeholder="IELTS 8.5, CELTA..." /></label>
          </div>
          <label>Qisqacha<textarea rows={2} value={t.bio} onChange={(e) => setT({ ...t, bio: e.target.value })} maxLength={600} /></label>
          <div className="row" style={{ gap: 10, flexWrap: 'wrap', justifyContent: 'flex-start' }}>
            <label style={{ flex: '1 1 240px' }}>Rasm havolasi (ixtiyoriy)<input value={t.photo_url} onChange={(e) => setT({ ...t, photo_url: e.target.value })} placeholder="https://..." /></label>
            <label style={{ flex: '1 1 240px' }}>Darsdan video (YouTube, ixtiyoriy)<input value={t.video_url} onChange={(e) => setT({ ...t, video_url: e.target.value })} placeholder="https://youtu.be/..." /></label>
          </div>
          <div className="row" style={{ justifyContent: 'flex-start' }}><button className="btn sm" disabled={busy === 't'}>Ustoz qo'shish</button></div>
        </form>
      </div>
    </div>
  );
}
