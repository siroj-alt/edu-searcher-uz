'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { useMe, refreshMe, signOut, rpcMsg, fmtSum, fmtDay, fmtMonth, monthsFrom, thisMonth, APP_STATUS, PAY_METHOD, PAY_STATUS } from '../../lib/auth';
import SavedList from '../SavedList';

const TABS = [['markazlar', 'Markazlarim'], ['tolov', "To'lovlar"], ['saqlangan', 'Saqlanganlar'], ['profil', 'Profil']];
const ENR_STATUS = { active: "O'qiyapman", finished: 'Tugatilgan', left: "To'xtatilgan" };
const ext = { target: '_blank', rel: 'noopener noreferrer' };

// Foydalanuvchining shaxsiy kabineti
export default function UserCabinet({ initialTab = '' }) {
  const me = useMe();
  const [tab, setTab] = useState(TABS.some(([k]) => k === initialTab) ? initialTab : 'markazlar');
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    if (!me) return;
    const [a, e, p] = await Promise.all([
      supabase.from('applications').select('id,center_id,course_name,status,reply,note,created_at,centers(name)').eq('user_id', me.id).order('created_at', { ascending: false }).limit(200),
      supabase.from('enrollments').select('id,center_id,course_name,group_name,monthly_fee,started_on,ended_on,status,centers(name)').eq('user_id', me.id).order('created_at', { ascending: false }).limit(200),
      supabase.from('payments').select('id,enrollment_id,period,amount,method,status,note,created_at').eq('user_id', me.id).order('period', { ascending: false }).limit(1000)
    ]);
    if (a.error || e.error || p.error) { setErr("Ma'lumotlarni yuklab bo'lmadi. Internetni tekshirib, sahifani yangilang."); return; }
    const ids = [...new Set((e.data || []).map((x) => x.center_id))];
    const info = ids.length ? await supabase.from('center_payment_info').select('*').in('center_id', ids) : { data: [] };
    setErr('');
    setD({ apps: a.data || [], enr: e.data || [], pays: p.data || [], info: Object.fromEntries((info.data || []).map((x) => [x.center_id, x])) });
  }, [me]);
  useEffect(() => { load(); }, [load]);

  if (me === undefined) return <div className="wrap page"><div className="card muted">Yuklanmoqda...</div></div>;
  if (!me) {
    return (
      <div className="wrap page">
        <div className="card empty-state">
          <h1 className="h2">Shaxsiy kabinet</h1>
          <p className="muted">Saqlangan markazlar, arizalar va to'lovlaringizni ko'rish uchun kabinetingizga kiring.</p>
          <p style={{ marginTop: 14 }}><Link className="btn" href="/kirish?next=/kabinet">Kirish yoki ro'yxatdan o'tish</Link></p>
        </div>
      </div>
    );
  }

  const active = (d?.enr || []).filter((x) => x.status === 'active');
  return (
    <div className="wrap page">
      <div className="cab-head">
        <div>
          <h1 className="h1s">Salom, {(me.full_name || me.login || 'foydalanuvchi').split(/\s+/)[0]}!</h1>
          <p className="muted">Shaxsiy kabinet{me.login ? ` · login: ${me.login}` : ''}</p>
        </div>
        <div className="row">
          {me.role === 'center_owner' ? <Link className="btn sm" href="/markaz-kabineti">Markaz kabineti</Link> : null}
          <button type="button" className="btn ghost sm" onClick={() => signOut()}>Chiqish</button>
        </div>
      </div>
      <div className="tabs">
        {TABS.map(([k, v]) => <button key={k} type="button" className={'tab' + (tab === k ? ' on' : '')} onClick={() => setTab(k)}>{v}</button>)}
      </div>
      {err ? <div className="formmsg err" style={{ marginBottom: 12 }}>{err}</div> : null}

      {tab === 'markazlar' ? (
        !d ? <div className="card muted">Yuklanmoqda...</div> : (
          <>
            {active.length ? (
              <>
                <div className="sec" style={{ marginTop: 10 }}><h2>O'qiyotgan kurslarim</h2><i /></div>
                <div className="grid2">
                  {active.map((x) => (
                    <div key={x.id} className="card" style={{ marginBottom: 0 }}>
                      <Link href={`/centers/${x.center_id}`}><b style={{ fontSize: 17 }}>{x.centers?.name || 'Markaz'}</b></Link>
                      <div className="tags">
                        <span className="tag on">{x.course_name}</span>
                        {x.group_name ? <span className="tag">{x.group_name}</span> : null}
                        <span className="tag">{fmtDay(x.started_on)} dan</span>
                      </div>
                      <div className="crow" style={{ marginTop: 8 }}>
                        <span className="muted">Oylik to'lov</span>
                        <b>{x.monthly_fee ? fmtSum(x.monthly_fee) : 'Belgilanmagan'}</b>
                      </div>
                      <button type="button" className="btn sm" style={{ marginTop: 10 }} onClick={() => setTab('tolov')}>To'lovlar</button>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
            <div className="sec" style={{ marginTop: active.length ? 34 : 10 }}><h2>Arizalarim</h2><i /></div>
            {d.apps.length ? d.apps.map((a) => <AppRow key={a.id} a={a} onChange={load} />) : (
              <div className="card empty-state">
                <h2 className="h2">Hali ariza yubormagansiz</h2>
                <p className="muted">O'zingizga mos markazni toping va uning sahifasidagi «O'qishga ariza berish» formasini to'ldiring.</p>
                <p style={{ marginTop: 14 }}><Link className="btn" href="/search">Markazlarni ko'rish</Link></p>
              </div>
            )}
          </>
        )
      ) : null}

      {tab === 'tolov' ? (!d ? <div className="card muted">Yuklanmoqda...</div> : <PaymentsTab d={d} onChange={load} />) : null}

      {tab === 'saqlangan' ? (
        <>
          <p className="muted" style={{ marginBottom: 14 }}>Yoqqan markazlarni yurakcha belgisi bilan saqlang: ular kabinetingizda turadi va barcha qurilmalaringizda ko'rinadi.</p>
          <SavedList />
        </>
      ) : null}

      {tab === 'profil' ? <ProfileTab me={me} /> : null}
    </div>
  );
}

function AppRow({ a, onChange }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  async function cancel() {
    if (!confirm('Arizani bekor qilasizmi?')) return;
    setBusy(true);
    const { error } = await supabase.rpc('cancel_application', { p_id: a.id });
    setBusy(false);
    if (error) return setErr(rpcMsg(error));
    onChange();
  }
  return (
    <div className="card">
      <div className="row">
        <div>
          <Link href={`/centers/${a.center_id}`}><b>{a.centers?.name || 'Markaz'}</b></Link>
          <div className="muted" style={{ fontSize: 14 }}>{a.course_name || "Kurs ko'rsatilmagan"} · {fmtDay(a.created_at)}</div>
        </div>
        <div className="row">
          <span className={'pillst ' + a.status}>{APP_STATUS[a.status] || a.status}</span>
          {a.status === 'new' || a.status === 'contacted' ? <button type="button" className="btn ghost sm" disabled={busy} onClick={cancel}>Bekor qilish</button> : null}
        </div>
      </div>
      {a.status === 'new' ? <p className="muted" style={{ fontSize: 13.5, marginTop: 8 }}>Ariza markazga yetkazildi. Markaz siz bilan bog'lanadi.</p> : null}
      {a.status === 'accepted' ? <p className="ok" style={{ fontSize: 13.5, marginTop: 8 }}>Siz kursga qabul qilindingiz. Kurs «O'qiyotgan kurslarim» bo'limida.</p> : null}
      {a.status === 'rejected' && a.reply ? <p className="muted" style={{ fontSize: 13.5, marginTop: 8 }}>Markaz izohi: {a.reply}</p> : null}
      {err ? <div className="formmsg err">{err}</div> : null}
    </div>
  );
}

function PaymentsTab({ d, onChange }) {
  const list = [...d.enr].sort((a, b) => (a.status === 'active' ? 0 : 1) - (b.status === 'active' ? 0 : 1));
  if (!list.length) {
    return (
      <div className="card empty-state">
        <h2 className="h2">To'lovlar hozircha yo'q</h2>
        <p className="muted">Markaz arizangizni qabul qilib, sizni kursga qo'shgach, oylik to'lovlar shu yerda paydo bo'ladi.</p>
      </div>
    );
  }
  return (
    <>
      <p className="muted" style={{ marginBottom: 14 }}>
        To'lovni markaz ko'rsatgan usulda (Payme, Click yoki karta) amalga oshiring va «To'lov qildim» tugmasini bosing. Markaz tasdiqlagach, holat «To'langan» ga o'zgaradi.
      </p>
      {list.map((e) => <EnrollPay key={e.id} e={e} pays={d.pays.filter((p) => p.enrollment_id === e.id)} info={d.info[e.center_id]} onChange={onChange} />)}
    </>
  );
}

function EnrollPay({ e, pays, info, onChange }) {
  const [open, setOpen] = useState('');
  const [method, setMethod] = useState(info?.payme_url ? 'payme' : info?.click_url ? 'click' : info?.card_number ? 'card' : 'cash');
  const [note, setNote] = useState('');
  const [st, setSt] = useState({ busy: false, err: '' });
  const [copied, setCopied] = useState(false);
  const byMonth = {};
  for (const p of pays) if (p.status !== 'rejected' || !byMonth[p.period]) byMonth[p.period] = p;
  const endIso = e.ended_on ? String(e.ended_on).slice(0, 7) + '-01' : null;
  // Keyingi oy faqat joriy oy to'langan (yoki tekshirilayotgan) bo'lsa ko'rsatiladi
  const cur = byMonth[thisMonth()];
  const ahead = e.status === 'active' && cur && cur.status !== 'rejected' ? 1 : 0;
  const months = monthsFrom(e.started_on, ahead).filter((m) => !endIso || m <= endIso).slice(0, 12);

  async function report(period) {
    setSt({ busy: true, err: '' });
    const { error } = await supabase.rpc('report_payment', { p_enrollment: e.id, p_period: period, p_method: method, p_note: note.trim() || null });
    if (error) return setSt({ busy: false, err: rpcMsg(error, "To'lov yuborilmadi. Qayta urinib ko'ring.") });
    setSt({ busy: false, err: '' }); setOpen(''); setNote('');
    onChange();
  }
  function copy() {
    try { navigator.clipboard.writeText(String(info.card_number).replace(/\s/g, '')); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* nusxalab bo'lmasa raqam ko'rinib turibdi */ }
  }

  return (
    <div className="card">
      <div className="row">
        <div>
          <Link href={`/centers/${e.center_id}`}><b style={{ fontSize: 17 }}>{e.centers?.name || 'Markaz'}</b></Link>
          <div className="muted" style={{ fontSize: 14 }}>{e.course_name}{e.group_name ? ` · ${e.group_name}` : ''} · {ENR_STATUS[e.status]}</div>
        </div>
        <span className="kmb">{e.monthly_fee ? `${fmtSum(e.monthly_fee)}/oy` : 'Summa belgilanmagan'}</span>
      </div>
      {!e.monthly_fee ? <p className="muted" style={{ fontSize: 13.5, marginTop: 8 }}>Oylik to'lov summasini markaz hali belgilamagan. Markazga murojaat qiling.</p> : null}
      <div style={{ marginTop: 10 }}>
        {months.map((m) => {
          const p = byMonth[m];
          const state = p && p.status !== 'rejected' ? p.status : 'none';
          return (
            <div key={m}>
              <div className="crow">
                <span><b>{fmtMonth(m)}</b>{p && p.status === 'rejected' ? <small className="muted"> · oldingi to'lov rad etilgan</small> : null}</span>
                {state === 'none'
                  ? (e.monthly_fee ? <button type="button" className="btn sm" onClick={() => { setOpen(open === m ? '' : m); setSt({ busy: false, err: '' }); }}>{open === m ? 'Yopish' : "To'lash"}</button> : <span className="pillst rejected">To'lanmagan</span>)
                  : <span className={'pillst ' + (state === 'pending' ? 'pending' : '')}>{PAY_STATUS[state]}{state === 'paid' ? ` · ${fmtSum(p.amount)}` : ''}</span>}
              </div>
              {open === m && state === 'none' ? (
                <div className="paybox">
                  <div className="row"><span className="muted">To'lov summasi</span><b style={{ fontSize: 18 }}>{fmtSum(e.monthly_fee)}</b></div>
                  {info && (info.payme_url || info.click_url || info.card_number) ? (
                    <div className="payopts">
                      {info.payme_url ? <a className="btn sm" href={info.payme_url} {...ext} onClick={() => setMethod('payme')}>Payme orqali to'lash</a> : null}
                      {info.click_url ? <a className="btn sm" href={info.click_url} {...ext} onClick={() => setMethod('click')}>Click orqali to'lash</a> : null}
                      {info.card_number ? (
                        <div className="paycard">
                          <span className="muted">Karta raqami{info.card_holder ? ` (${info.card_holder})` : ''}</span>
                          <b>{info.card_number}</b>
                          <button type="button" className="btn ghost sm" onClick={() => { copy(); setMethod('card'); }}>{copied ? 'Nusxalandi' : 'Nusxalash'}</button>
                        </div>
                      ) : null}
                    </div>
                  ) : <p className="muted" style={{ fontSize: 13.5 }}>Markaz onlayn to'lov rekvizitlarini hali kiritmagan. To'lovni markazning o'zida amalga oshirib, shu yerda belgilab qo'yishingiz mumkin.</p>}
                  {info?.note ? <p className="muted" style={{ fontSize: 13.5 }}>{info.note}</p> : null}
                  <div className="two">
                    <label>To'lov usuli
                      <select value={method} onChange={(ev) => setMethod(ev.target.value)}>
                        {Object.entries(PAY_METHOD).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </label>
                    <label>Chek raqami yoki izoh (ixtiyoriy)<input value={note} onChange={(ev) => setNote(ev.target.value)} maxLength={300} /></label>
                  </div>
                  <button type="button" className="btn" disabled={st.busy} onClick={() => report(m)}>{st.busy ? 'Yuborilmoqda...' : "To'lov qildim"}</button>
                  {st.err ? <div className="formmsg err">{st.err}</div> : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProfileTab({ me }) {
  const [f, setF] = useState({ full_name: me.full_name || '', phone: me.phone || '+998 ' });
  const [pw, setPw] = useState({ a: '', b: '' });
  const [msg, setMsg] = useState({ ok: '', err: '' });
  const [pmsg, setPmsg] = useState({ ok: '', err: '' });
  const [busy, setBusy] = useState('');

  async function save(e) {
    e.preventDefault(); setBusy('p'); setMsg({ ok: '', err: '' });
    const { error } = await supabase.rpc('update_my_profile', { p_full_name: f.full_name, p_phone: f.phone });
    setBusy('');
    if (error) return setMsg({ ok: '', err: rpcMsg(error) });
    await refreshMe();
    setMsg({ ok: 'Saqlandi.', err: '' });
  }
  async function changePw(e) {
    e.preventDefault(); setPmsg({ ok: '', err: '' });
    if (pw.a.length < 6) return setPmsg({ ok: '', err: "Parol kamida 6 belgidan iborat bo'lsin." });
    if (pw.a !== pw.b) return setPmsg({ ok: '', err: 'Parollar bir xil emas.' });
    setBusy('w');
    const { error } = await supabase.auth.updateUser({ password: pw.a });
    setBusy('');
    if (error) return setPmsg({ ok: '', err: "Parol o'zgartirilmadi. Qayta urinib ko'ring." });
    setPw({ a: '', b: '' }); setPmsg({ ok: "Parol o'zgartirildi.", err: '' });
  }

  return (
    <div className="grid2">
      <form className="card stack" onSubmit={save} style={{ marginBottom: 0 }}>
        <b>Shaxsiy ma'lumotlar</b>
        <label>Login<input value={me.login || me.email || ''} disabled readOnly /></label>
        <label>Ism familiya<input value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} maxLength={80} /></label>
        <label>Telefon raqam<input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} maxLength={20} inputMode="tel" /></label>
        <button className="btn sm" disabled={busy === 'p'}>Saqlash</button>
        {msg.ok ? <div className="formmsg ok">{msg.ok}</div> : null}
        {msg.err ? <div className="formmsg err">{msg.err}</div> : null}
      </form>
      <form className="card stack" onSubmit={changePw} style={{ marginBottom: 0 }}>
        <b>Parolni o'zgartirish</b>
        <label>Yangi parol<input type="password" value={pw.a} onChange={(e) => setPw({ ...pw, a: e.target.value })} maxLength={72} autoComplete="new-password" /></label>
        <label>Yangi parolni takrorlang<input type="password" value={pw.b} onChange={(e) => setPw({ ...pw, b: e.target.value })} maxLength={72} autoComplete="new-password" /></label>
        <button className="btn sm" disabled={busy === 'w'}>Parolni o'zgartirish</button>
        {pmsg.ok ? <div className="formmsg ok">{pmsg.ok}</div> : null}
        {pmsg.err ? <div className="formmsg err">{pmsg.err}</div> : null}
      </form>
    </div>
  );
}
