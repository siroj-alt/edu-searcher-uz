'use client';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { rpcMsg, fmtDay } from '../../lib/auth';

const label = (b, dist) => [dist[b.district_id], b.address].filter(Boolean).join(', ') || 'Manzil ko\'rsatilmagan';
const today = () => new Date(Date.now() + 5 * 3600e3).toISOString().slice(0, 10);
const plusDays = (n) => new Date(Date.now() + 5 * 3600e3 + n * 864e5).toISOString().slice(0, 10);

// O'quvchi kabineti: o'qiyotgan kursni markazning boshqa filialiga ko'chirish arizasi
// Ariza sayt ma'muriyatida tasdiqlangach, o'qish yangi filialga o'tadi
export default function BranchTransfer({ e, branches, dist, transfers, onChange }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ to: '', reason: '', from: '' });
  const [st, setSt] = useState({ busy: false, err: '' });
  const cur = branches.find((b) => b.id === e.branch_id);
  const others = branches.filter((b) => b.id !== e.branch_id);
  const mine = transfers.filter((t) => t.enrollment_id === e.id);
  const pending = mine.find((t) => t.status === 'pending');
  const last = mine.find((t) => t.status === 'approved' || t.status === 'rejected');
  const recent = last && Date.now() - new Date(last.decided_at || last.created_at).getTime() < 14 * 864e5 ? last : null;
  const byId = Object.fromEntries(branches.map((b) => [b.id, b]));

  async function submit(ev) {
    ev.preventDefault();
    if (!f.to) return setSt({ busy: false, err: "Qaysi filialga ko'chmoqchi ekaningizni tanlang." });
    setSt({ busy: true, err: '' });
    const { error } = await supabase.rpc('request_branch_transfer', { p_enrollment: e.id, p_to_branch: f.to, p_reason: f.reason.trim() || null, p_from: f.from || null });
    if (error) return setSt({ busy: false, err: rpcMsg(error, "Ariza yuborilmadi. Qayta urinib ko'ring.") });
    setSt({ busy: false, err: '' }); setOpen(false); setF({ to: '', reason: '', from: '' });
    onChange?.();
  }
  async function cancel() {
    setSt({ busy: true, err: '' });
    const { error } = await supabase.rpc('cancel_branch_transfer', { p_id: pending.id });
    setSt({ busy: false, err: error ? rpcMsg(error) : '' });
    if (!error) onChange?.();
  }

  return (
    <div className="btr">
      <div className="crow" style={{ marginTop: 8 }}>
        <span className="muted">Filial</span>
        <b className="btr-cur">{cur ? label(cur, dist) : branches.length > 1 ? "Markaz belgilamagan" : branches[0] ? label(branches[0], dist) : '—'}</b>
      </div>

      {pending ? (
        <div className="btr-st wait" role="status">
          <b>Ko'chirish arizasi ko'rib chiqilmoqda</b>
          <span>{`Yangi filial: ${byId[pending.to_branch_id] ? label(byId[pending.to_branch_id], dist) : '—'}${pending.wanted_from ? ` · ${fmtDay(pending.wanted_from)} dan` : ''}`}</span>
          <button type="button" className="linkbtn" onClick={cancel} disabled={st.busy}>Arizani bekor qilish</button>
        </div>
      ) : recent ? (
        <div className={'btr-st ' + (recent.status === 'approved' ? 'ok' : 'bad')} role="status">
          <b>{recent.status === 'approved' ? "O'qishingiz yangi filialga ko'chirildi" : "Ko'chirish arizasi rad etildi"}</b>
          {recent.admin_note ? <span>{recent.admin_note}</span> : null}
        </div>
      ) : null}

      {!pending && others.length && e.status === 'active' ? (
        open ? (
          <form className="btr-form" onSubmit={submit}>
            <label>Qaysi filialga ko'chmoqchisiz?
              <select value={f.to} onChange={(x) => setF({ ...f, to: x.target.value })}>
                <option value="">Filialni tanlang</option>
                {others.map((b) => <option key={b.id} value={b.id}>{label(b, dist)}</option>)}
              </select>
            </label>
            <label>Qachondan (ixtiyoriy)<input type="date" value={f.from} min={today()} max={plusDays(90)} onChange={(x) => setF({ ...f, from: x.target.value })} /></label>
            <label>Sababi (ixtiyoriy)<textarea rows={2} maxLength={500} value={f.reason} onChange={(x) => setF({ ...f, reason: x.target.value })} placeholder="Masalan: uyimga yaqinroq, dars vaqti qulayroq" /></label>
            <p className="muted small" style={{ margin: 0 }}>Ariza sayt ma'muriyati tomonidan ko'rib chiqiladi. Tasdiqlangach o'qishingiz yangi filialga o'tadi, markaz guruh va jadvalni siz bilan kelishadi.</p>
            <div className="row" style={{ justifyContent: 'flex-start' }}>
              <button className="btn sm" disabled={st.busy}>{st.busy ? 'Yuborilmoqda…' : 'Ariza yuborish'}</button>
              <button type="button" className="btn ghost sm" onClick={() => { setOpen(false); setSt({ busy: false, err: '' }); }}>Bekor qilish</button>
            </div>
          </form>
        ) : (
          <button type="button" className="btn ghost sm btr-open" onClick={() => setOpen(true)}>Boshqa filialga ko'chirish</button>
        )
      ) : null}
      {st.err ? <div className="formmsg err" role="alert">{st.err}</div> : null}
    </div>
  );
}
