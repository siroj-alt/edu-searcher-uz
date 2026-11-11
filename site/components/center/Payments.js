'use client';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { rpcMsg, fmtSum, fmtDay, fmtMonth, PAY_METHOD, PAY_STATUS } from '../../lib/auth';

const nz = (v) => (v && String(v).trim() ? String(v).trim() : null);

// Markaz: o'quvchilar yuborgan to'lovlarni tasdiqlash, to'lovlar tarixi va to'lov rekvizitlari
export default function Payments({ centerId, onChange }) {
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(0);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('payments')
      .select('id,period,amount,method,status,note,created_at,confirmed_at,enrollments(full_name,phone,course_name,group_name)')
      .eq('center_id', centerId).order('created_at', { ascending: false }).limit(500);
    if (error) { setErr("To'lovlarni yuklab bo'lmadi."); setRows([]); return; }
    setErr(''); setRows(data || []);
  }, [centerId]);
  useEffect(() => { setRows(null); load(); }, [load]);

  async function decide(id, status) {
    if (status === 'rejected' && !confirm("To'lovni rad etasizmi? O'quvchi qayta yuborishi mumkin bo'ladi.")) return;
    setBusy(id);
    const { error } = await supabase.rpc('confirm_payment', { p_id: id, p_status: status });
    setBusy(0);
    if (error) return setErr(rpcMsg(error));
    load(); onChange?.();
  }

  const pending = (rows || []).filter((r) => r.status === 'pending');
  const done = (rows || []).filter((r) => r.status !== 'pending');
  const table = (list, actions) => (
    <div className="card ascroll" style={{ padding: 0 }}>
      <table className="atable">
        <thead><tr><th>Sana</th><th>O'quvchi</th><th>Kurs</th><th>Oy</th><th>Summa</th><th>Usul / izoh</th><th>{actions ? '' : 'Holat'}</th></tr></thead>
        <tbody>
          {list.map((r) => (
            <tr key={r.id} className={r.status === 'pending' ? 'new' : ''}>
              <td style={{ whiteSpace: 'nowrap' }}>{fmtDay(r.created_at)}</td>
              <td><b>{r.enrollments?.full_name}</b><div className="muted">{r.enrollments?.phone}</div></td>
              <td>{r.enrollments?.course_name}{r.enrollments?.group_name ? <div className="muted">{r.enrollments.group_name}</div> : null}</td>
              <td style={{ whiteSpace: 'nowrap' }}>{fmtMonth(r.period)}</td>
              <td style={{ whiteSpace: 'nowrap' }}><b>{fmtSum(r.amount)}</b></td>
              <td>{PAY_METHOD[r.method] || r.method}{r.note ? <div className="muted">{r.note}</div> : null}</td>
              <td>
                {actions ? (
                  <div className="acts">
                    <button type="button" className="btn sm" disabled={busy === r.id} onClick={() => decide(r.id, 'paid')}>Tasdiqlash</button>
                    <button type="button" className="btn ghost sm" disabled={busy === r.id} onClick={() => decide(r.id, 'rejected')}>Rad etish</button>
                  </div>
                ) : (
                  <div className="acts">
                    <span className={'pillst ' + (r.status === 'rejected' ? 'rejected' : '')}>{PAY_STATUS[r.status]}</span>
                    {r.status === 'paid' ? <button type="button" className="btn ghost sm" disabled={busy === r.id} onClick={() => decide(r.id, 'rejected')}>Bekor qilish</button> : null}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      {err ? <div className="formmsg err" style={{ marginBottom: 12 }}>{err}</div> : null}
      <div className="sec" style={{ marginTop: 6 }}><h2>Tasdiqlash kutilmoqda{pending.length ? ` (${pending.length})` : ''}</h2><i /></div>
      {rows === null ? <div className="card muted">Yuklanmoqda...</div> : pending.length ? table(pending, true)
        : <div className="card muted">Tasdiqlanishi kerak bo'lgan to'lov yo'q. O'quvchi kabinetida «To'lov qildim» ni bossa, to'lov shu yerda paydo bo'ladi.</div>}

      <div className="sec"><h2>To'lov rekvizitlari</h2><i /></div>
      <PayInfo centerId={centerId} />

      <div className="sec"><h2>To'lovlar tarixi</h2><i /></div>
      {rows === null ? null : done.length ? table(done, false) : <div className="card muted">Hali to'lov yo'q.</div>}
    </>
  );
}

// O'quvchilar kabinetida ko'rinadigan rekvizitlar: Payme / Click havolasi yoki karta
function PayInfo({ centerId }) {
  const [f, setF] = useState(null);
  const [msg, setMsg] = useState({ ok: '', err: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setF(null);
    supabase.from('center_payment_info').select('payme_url,click_url,card_number,card_holder,note').eq('center_id', centerId).maybeSingle().then(({ data }) => {
      setF({ payme_url: data?.payme_url || '', click_url: data?.click_url || '', card_number: data?.card_number || '', card_holder: data?.card_holder || '', note: data?.note || '' });
    });
  }, [centerId]);

  async function save(e) {
    e.preventDefault(); setMsg({ ok: '', err: '' });
    for (const k of ['payme_url', 'click_url']) {
      if (f[k].trim() && !/^https:\/\//i.test(f[k].trim())) return setMsg({ ok: '', err: "Havola https:// bilan boshlanishi kerak." });
    }
    if (f.card_number.trim() && !/^[0-9 ]{12,23}$/.test(f.card_number.trim())) return setMsg({ ok: '', err: "Karta raqamini to'g'ri kiriting (faqat raqamlar)." });
    setBusy(true);
    const { error } = await supabase.from('center_payment_info').upsert({
      center_id: centerId, payme_url: nz(f.payme_url), click_url: nz(f.click_url), card_number: nz(f.card_number),
      card_holder: nz(f.card_holder), note: nz(f.note), updated_at: new Date().toISOString()
    }, { onConflict: 'center_id' });
    setBusy(false);
    setMsg(error ? { ok: '', err: "Saqlanmadi. Ma'lumotlarni tekshirib, qayta urinib ko'ring." } : { ok: 'Saqlandi.', err: '' });
  }

  if (!f) return <div className="card muted">Yuklanmoqda...</div>;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <form className="card stack" onSubmit={save}>
      <p className="muted">O'quvchi «To'lash» tugmasini bosganda shu rekvizitlar ko'rsatiladi. Payme yoki Click'dagi to'lov havolangizni va (yoki) karta raqamingizni kiriting.</p>
      <div className="two">
        <label>Payme to'lov havolasi<input value={f.payme_url} onChange={set('payme_url')} maxLength={300} placeholder="https://payme.uz/..." /></label>
        <label>Click to'lov havolasi<input value={f.click_url} onChange={set('click_url')} maxLength={300} placeholder="https://my.click.uz/..." /></label>
      </div>
      <div className="two">
        <label>Karta raqami<input value={f.card_number} onChange={set('card_number')} maxLength={23} inputMode="numeric" placeholder="8600 0000 0000 0000" /></label>
        <label>Karta egasi<input value={f.card_holder} onChange={set('card_holder')} maxLength={80} placeholder="Ism familiya" /></label>
      </div>
      <label>Izoh (ixtiyoriy)<input value={f.note} onChange={set('note')} maxLength={300} placeholder="Masalan: to'lov har oyning 5-sanasigacha qabul qilinadi" /></label>
      <button className="btn sm" disabled={busy}>Saqlash</button>
      {msg.ok ? <div className="formmsg ok">{msg.ok}</div> : null}
      {msg.err ? <div className="formmsg err">{msg.err}</div> : null}
    </form>
  );
}
