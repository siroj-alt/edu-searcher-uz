'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { refreshMe, rpcMsg, fmtSum, fmtDay } from '../../lib/auth';

// Kichik chiziqli belgilar (sayt belgilari bilan bir uslubda)
const sv = (d, s = 20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>;
export const IC = {
  user: (s) => sv(<><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></>, s),
  family: (s) => sv(<><circle cx="8" cy="7" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M2.5 20c.8-3.5 3-5.5 5.5-5.5s4.7 2 5.5 5.5M14 20c.4-2.6 1.6-4.2 3-4.2s2.8 1.6 3.5 4.2" /></>, s),
  gift: (s) => sv(<><rect x="3" y="8" width="18" height="13" rx="2" /><path d="M12 8v13M3 12h18M12 8c-2-4-6-4-6-1.5S9 8 12 8zm0 0c2-4 6-4 6-1.5S15 8 12 8z" /></>, s),
  book: (s) => sv(<><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" /><path d="M8 7h7" /></>, s),
  bell: (s) => sv(<><path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 8 2.5 8h-17S6 15 6 9z" /><path d="M10 20a2 2 0 0 0 4 0" /></>, s),
  wallet: (s) => sv(<><rect x="3" y="6" width="18" height="14" rx="3" /><path d="M3 10h18M16 15h2" /></>, s),
  send: (s) => sv(<path d="M21 4L3 11l6 2.5L11.5 20l3-5 5.5 4z" />, s),
  spark: (s) => sv(<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />, s),
  percent: (s) => sv(<><path d="M19 5L5 19" /><circle cx="7" cy="7" r="2.5" /><circle cx="17" cy="17" r="2.5" /></>, s),
  info: (s) => sv(<><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>, s),
  copy: (s) => sv(<><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h8" /></>, s),
  trophy: (s) => sv(<><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z" /><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4" /></>, s)
};

const initials = (n) => String(n || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

// ===== Ro'yxatdan o'tishda: "O'zim uchun" / "Farzandim uchun" =====
export function AccountTypePicker({ value, onChange }) {
  const opts = [
    ['student', "O'zim uchun", "O'zim kursga yozilaman va o'qiyman", IC.user],
    ['parent', 'Farzandim uchun', "Farzandimning o'qishini kuzataman", IC.family]
  ];
  return (
    <div className="acct-pick" role="radiogroup" aria-label="Hisob turi">
      {opts.map(([k, t, d, ic]) => (
        <button key={k} type="button" role="radio" aria-checked={value === k} className={value === k ? 'on' : ''} onClick={() => onChange(k)}>
          <i>{ic(20)}</i>
          <b>{t}</b>
          <small>{d}</small>
        </button>
      ))}
    </div>
  );
}

// ===== Profil: hisob turini almashtirish =====
export function AccountTypeCard({ me }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  async function change(v) {
    if (v === me.accountType || busy) return;
    setBusy(true); setErr('');
    const { error } = await supabase.rpc('set_account_type', { p_type: v });
    if (error) { setBusy(false); return setErr(rpcMsg(error, "O'zgartirib bo'lmadi.")); }
    await refreshMe();
    setBusy(false);
  }
  return (
    <div className="card stack" style={{ marginBottom: 0 }}>
      <b>Hisob turi</b>
      <AccountTypePicker value={me.accountType} onChange={change} />
      <p className="muted" style={{ fontSize: 13.5 }}>Turini istalgan vaqtda o'zgartirishingiz mumkin. Ma'lumotlaringiz o'chmaydi.</p>
      {err ? <div className="formmsg err">{err}</div> : null}
    </div>
  );
}

// ===== Do'stni taklif qilish =====
export function ReferralCard() {
  const [d, setD] = useState(null);
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState({ ok: '', err: '' });
  const [copied, setCopied] = useState(false);
  const load = useCallback(() => { supabase.rpc('my_referral').then(({ data }) => setD(data || null), () => {}); }, []);
  useEffect(() => { load(); }, [load]);
  const link = d?.code ? `https://edusearcher.uz/kirish?ref=${d.code}` : '';
  async function share() {
    const text = `EduSearcher'da o'quv markazini tanlang. Mening taklif kodim: ${d.code}`;
    try {
      if (navigator.share) await navigator.share({ title: 'EduSearcher', text, url: link });
      else { await navigator.clipboard.writeText(`${text}\n${link}`); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    } catch { /* bekor qilindi */ }
  }
  async function apply(e) {
    e.preventDefault(); setMsg({ ok: '', err: '' });
    if (!code.trim()) return;
    const { error } = await supabase.rpc('apply_referral', { p_code: code.trim() });
    if (error) return setMsg({ ok: '', err: rpcMsg(error, "Kod qabul qilinmadi.") });
    setCode(''); setMsg({ ok: "Kod qabul qilindi. Rahmat!", err: '' });
  }
  return (
    <div className="card stack ref-card" style={{ marginBottom: 0 }}>
      <div className="ref-h">
        <i>{IC.gift(22)}</i>
        <div><b>Do'stingizni taklif qiling</b><p className="muted">Do'stingiz kodingiz bilan ro'yxatdan o'tib, kursga yozilsa — ikkalangizga sovg'a.</p></div>
      </div>
      {d?.code ? (
        <>
          <div className="ref-code">
            <b>{d.code}</b>
            <button type="button" className="btn sm" onClick={share}>{copied ? 'Nusxalandi' : 'Ulashish'}</button>
          </div>
          <div className="ref-stats">
            <div><b>{d.invited || 0}</b><small>taklif qilingan</small></div>
            <div><b>{d.enrolled || 0}</b><small>kursga yozilgan</small></div>
          </div>
        </>
      ) : <p className="muted">Yuklanmoqda...</p>}
      <form className="row" onSubmit={apply} style={{ justifyContent: 'flex-start', gap: 8 }}>
        <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={12} placeholder="Do'stingiz kodi" style={{ flex: 1, minWidth: 140 }} />
        <button className="btn ghost sm">Kiritish</button>
      </form>
      {msg.ok ? <div className="formmsg ok">{msg.ok}</div> : null}
      {msg.err ? <div className="formmsg err">{msg.err}</div> : null}
    </div>
  );
}

// ===== Oila: ota-ona ↔ farzand =====
export function FamilyTab({ mode = 'parent' }) {
  const [d, setD] = useState(null);
  const [code, setCode] = useState('');
  const [mine, setMine] = useState(null);
  const [st, setSt] = useState({ busy: false, err: '', ok: '' });
  const [diary, setDiary] = useState(null);

  const load = useCallback(async () => {
    const [a, b] = await Promise.all([supabase.rpc('my_children'), supabase.rpc('my_parents')]);
    setD({ kids: a.data || [], parents: b.data || [] });
  }, []);
  useEffect(() => { load(); }, [load]);

  async function link(e) {
    e.preventDefault();
    if (!code.trim()) return;
    setSt({ busy: true, err: '', ok: '' });
    const { error } = await supabase.rpc('link_family', { p_code: code.trim() });
    if (error) return setSt({ busy: false, err: rpcMsg(error, "Ulab bo'lmadi. Kodni tekshiring."), ok: '' });
    setCode(''); setSt({ busy: false, err: '', ok: "Farzandingiz ulandi." });
    load();
  }
  async function makeCode() {
    setSt({ busy: true, err: '', ok: '' });
    const { data, error } = await supabase.rpc('create_family_code');
    if (error) return setSt({ busy: false, err: rpcMsg(error, "Kod yaratib bo'lmadi."), ok: '' });
    setMine(typeof data === 'string' ? data : data?.code || ''); setSt({ busy: false, err: '', ok: '' });
  }
  async function unlink(p) {
    if (!confirm(`${p.name} bilan bog'lanish uzilsinmi?`)) return;
    await supabase.rpc('unlink_family', { p_other: p.id });
    load();
  }

  if (!d) return <div className="card muted">Yuklanmoqda...</div>;

  if (mode === 'student') {
    return (
      <div className="grid2">
        <div className="card stack" style={{ marginBottom: 0 }}>
          <b>Ota-onam uchun kod</b>
          <p className="muted" style={{ fontSize: 14 }}>Kodni ota-onangizga bering: ular o'z kabinetida «Farzandlarim» bo'limiga kiritadi va davomatingiz, uy vazifalaringiz hamda to'lovlaringizni ko'ra oladi.</p>
          {mine ? <div className="ref-code"><b>{mine}</b><button type="button" className="btn ghost sm" onClick={() => { try { navigator.clipboard.writeText(mine); } catch {} }}>Nusxalash</button></div> : null}
          <button type="button" className="btn sm" disabled={st.busy} onClick={makeCode}>{mine ? 'Yangi kod olish' : 'Kod olish'}</button>
          <p className="muted" style={{ fontSize: 13 }}>Kod 24 soat amal qiladi.</p>
          {st.err ? <div className="formmsg err">{st.err}</div> : null}
        </div>
        <div className="card stack" style={{ marginBottom: 0 }}>
          <b>Ulangan ota-onalar</b>
          {d.parents.length ? d.parents.map((p) => (
            <div key={p.id} className="crow"><span>{p.name}</span><button type="button" className="btn ghost sm" onClick={() => unlink(p)}>Uzish</button></div>
          )) : <p className="muted">Hali hech kim ulanmagan.</p>}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="sec" style={{ marginTop: 10 }}><h2>Farzandlarim</h2><i /></div>
      {d.kids.length ? d.kids.map((k) => (
        <section key={k.id} className="card kid-card">
          <header className="row">
            <div className="row" style={{ justifyContent: 'flex-start', gap: 10 }}>
              <span className="kid-av">{initials(k.name)}</span>
              <b style={{ fontSize: 17 }}>{k.name}</b>
            </div>
            <button type="button" className="btn ghost sm" onClick={() => unlink(k)}>Uzish</button>
          </header>
          {k.enrollments.length ? k.enrollments.map((e) => (
            <div key={e.id} className="kid-enr">
              <div className="kid-enr-h"><Link href={`/centers/${e.center_id}`}><b>{e.center}</b></Link><span className="muted"> · {e.course}{e.group ? ` · ${e.group}` : ''}</span></div>
              <div className="kid-boxes">
                <div className="ok"><b>{e.present_30}</b><small>keldi (30 kun)</small></div>
                <div className={e.absent_30 ? 'bad' : ''}><b>{e.absent_30}</b><small>kelmadi</small></div>
                <div className="pur"><b>{e.fee ? Math.round(e.fee / 1000) + 'k' : '—'}</b><small>oylik to'lov</small></div>
              </div>
              {e.status === 'active' ? (
                e.paid_this_month ? <div className="kid-pay ok">Shu oy to'langan</div>
                  : e.reported_this_month ? <div className="kid-pay warn">Shu oy to'lovi tekshirilmoqda</div>
                  : <div className="kid-pay bad">Shu oy to'lanmagan{e.fee ? ` · ${fmtSum(e.fee)}` : ''}</div>
              ) : null}
              <button type="button" className="btn ghost sm" onClick={() => setDiary(diary === e.id ? null : e.id)}>{IC.book(16)} {diary === e.id ? 'Kundalikni yopish' : 'Kundalik: davomat va vazifalar'}</button>
              {diary === e.id ? <DiaryBox enrollmentId={e.id} /> : null}
            </div>
          )) : <p className="muted">Farzandingiz hali kursga yozilmagan.</p>}
        </section>
      )) : (
        <div className="card empty-state">
          <h2 className="h2">Farzandingizni ulang</h2>
          <p className="muted">Farzandingiz o'z kabinetida «Oila» bo'limidan kod oladi. Shu kodni pastga kiriting — uning davomati, baholari, uy vazifalari va to'lovlari shu yerda ko'rinadi.</p>
        </div>
      )}
      <form className="card stack" onSubmit={link}>
        <b>Farzandni bog'lash</b>
        <div className="row" style={{ justifyContent: 'flex-start', gap: 8 }}>
          <input value={code} onChange={(e) => setCode(e.target.value.replace(/\s/g, ''))} maxLength={12} placeholder="Farzandingiz kodi, masalan 123456" inputMode="numeric" style={{ flex: 1, minWidth: 160 }} />
          <button className="btn sm" disabled={st.busy}>Ulash</button>
        </div>
        {st.err ? <div className="formmsg err">{st.err}</div> : null}
        {st.ok ? <div className="formmsg ok">{st.ok}</div> : null}
      </form>
    </>
  );
}

// ===== Kundalik: davomat, baholar, uy vazifalari =====
const ATT = { present: ['Keldi', 'ok'], late: ['Kechikdi', 'warn'], absent: ['Kelmadi', 'bad'], excused: ['Sababli', 'mut'] };
export function DiaryBox({ enrollmentId }) {
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    supabase.rpc('my_diary', { p_enrollment: enrollmentId }).then(({ data, error }) => {
      if (error) setErr(rpcMsg(error, "Kundalikni yuklab bo'lmadi.")); else setD(data || {});
    });
  }, [enrollmentId]);
  if (err) return <div className="formmsg err">{err}</div>;
  if (!d) return <p className="muted">Yuklanmoqda...</p>;
  const att = d.attendance || [], hw = d.homework || [];
  const s = d.stats || {};
  const grades = att.map((a) => Number(a.grade)).filter((g) => g > 0);
  const avg = grades.length ? (grades.reduce((x, y) => x + y, 0) / grades.length).toFixed(1) : '—';
  return (
    <div className="diary">
      <div className="kid-boxes">
        <div className="ok"><b>{s.total ? Math.round((s.present / s.total) * 100) + '%' : '—'}</b><small>davomat</small></div>
        <div><b>{s.total || 0}</b><small>dars</small></div>
        <div className="pur"><b>{avg}</b><small>o'rtacha baho</small></div>
      </div>
      {att.length ? (
        <>
          <b className="diary-t">Oxirgi darslar</b>
          <div className="att-strip">
            {att.slice(0, 14).reverse().map((a) => (
              <span key={a.date} className={'att ' + (ATT[a.status]?.[1] || '')} title={`${fmtDay(a.date)} — ${ATT[a.status]?.[0] || a.status}${a.grade ? ', baho ' + a.grade : ''}${a.note ? ': ' + a.note : ''}`}>
                <small>{String(a.date).slice(8, 10)}.{String(a.date).slice(5, 7)}</small>
                <b>{a.grade || (a.status === 'absent' ? '–' : '✓')}</b>
              </span>
            ))}
          </div>
        </>
      ) : <p className="muted" style={{ fontSize: 14 }}>Markaz hali davomat belgilamagan.</p>}
      <b className="diary-t">Uy vazifalari</b>
      {hw.length ? hw.slice(0, 8).map((h) => (
        <div key={h.id} className="hw">
          <div><b>{h.title}</b>{h.details ? <p className="muted">{h.details}</p> : null}</div>
          {h.due ? <small className={new Date(h.due) < new Date(new Date().toDateString()) ? 'muted' : 'warn'}>muddat: {fmtDay(h.due)}</small> : null}
        </div>
      )) : <p className="muted" style={{ fontSize: 14 }}>Uy vazifasi berilmagan.</p>}
    </div>
  );
}

// ===== Xabarlar =====
const KIND = {
  new_course: ['#7950F2', IC.spark], price_drop: ['#0F9D6B', IC.percent], application: ['#228BE6', IC.send],
  payment_due: ['#F08C00', IC.wallet], homework: ['#1098AD', IC.book], absent: ['#E03131', IC.info],
  referral: ['#D6336C', IC.gift], family: ['#5C7CFA', IC.family], announce: ['#0F7B55', IC.bell]
};
const ago = (iso) => {
  const m = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 60) return `${m} daqiqa oldin`;
  if (m < 1440) return `${Math.round(m / 60)} soat oldin`;
  return fmtDay(iso);
};

export function useInbox(me) {
  const [list, setList] = useState(null);
  const load = useCallback(async () => {
    if (!me) return;
    const { data } = await supabase.rpc('my_notifications', { p_limit: 80 });
    setList(Array.isArray(data) ? data : []);
  }, [me]);
  useEffect(() => { load(); }, [load]);
  const markRead = useCallback(async () => {
    setList((l) => (l || []).map((n) => (n.read_at ? n : { ...n, read_at: new Date().toISOString(), _new: true })));
    await supabase.rpc('mark_notifications_read').then(() => {}, () => {});
  }, []);
  return { list, load, markRead, unread: (list || []).filter((n) => !n.read_at).length };
}

export function InboxTab({ inbox }) {
  const { list, markRead, unread } = inbox;
  const [filt, setFilt] = useState('all');
  useEffect(() => { if (unread) { const t = setTimeout(markRead, 2500); return () => clearTimeout(t); } return undefined; }, [unread, markRead]);
  const rows = useMemo(() => {
    const src = (list || []).filter((n) => (filt === 'unread' ? !n.read_at || n._new : filt === 'pay' ? n.kind === 'payment_due' : true));
    const start = new Date(); start.setHours(0, 0, 0, 0);
    return [['Bugun', src.filter((n) => new Date(n.created_at) >= start)], ['Avvalroq', src.filter((n) => new Date(n.created_at) < start)]];
  }, [list, filt]);
  if (list === null) return <div className="card muted">Yuklanmoqda...</div>;
  if (!list.length) {
    return (
      <div className="card empty-state">
        <h2 className="h2">Hozircha xabar yo'q</h2>
        <p className="muted">Arizangiz holati, saqlangan markazlardagi yangi kurs va narxlar, to'lov kuni va uy vazifalari haqidagi xabarlar shu yerga keladi.</p>
      </div>
    );
  }
  const nNew = list.filter((n) => !n.read_at || n._new).length;
  return (
    <>
      <div className="tabs chips">
        {[['all', 'Hammasi'], ['unread', `O'qilmagan${nNew ? ' · ' + nNew : ''}`], ['pay', "To'lovlar"]].map(([k, v]) => (
          <button key={k} type="button" className={'tab' + (filt === k ? ' on' : '')} onClick={() => setFilt(k)}>{v}</button>
        ))}
      </div>
      {rows.map(([h, arr]) => (arr.length ? (
        <div key={h}>
          <p className="inbox-h">{h}</p>
          {arr.map((n) => {
            const [col, ic] = KIND[n.kind] || ['#0F7B55', IC.bell];
            const isNew = !n.read_at || n._new;
            const inner = (
              <>
                <i style={{ background: col + '1F', color: col }}>{ic(20)}</i>
                <div>
                  <b>{n.title}</b>
                  {n.body ? <p>{n.body}</p> : null}
                  <small>{ago(n.created_at)}</small>
                </div>
                {isNew ? <em aria-label="Yangi" /> : null}
              </>
            );
            return n.center_id
              ? <Link key={n.id} href={`/centers/${n.center_id}`} className={'card inbox-row' + (isNew ? ' new' : '')}>{inner}</Link>
              : <div key={n.id} className={'card inbox-row' + (isNew ? ' new' : '')}>{inner}</div>;
          })}
        </div>
      ) : null))}
    </>
  );
}
