'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { rpcMsg } from '../../lib/auth';
import { ORG_FORMS, onlyDigits as digits, fmtInn } from '../../lib/legal';

// Markaz kabineti: yuridik ma'lumotlar (STIR). Kiritilgan bo'lsa faqat ko'rinadi, o'zgartirish — ma'muriyat orqali.
// Eski markazlar (STIR'siz ro'yxatdan o'tgan) uni bir marta shu yerda kiritadi.
export default function CenterLegal({ center }) {
  const [d, setD] = useState(undefined);
  const [f, setF] = useState({ form: '', inn: '', legal: '', director: '', license: '', email: '' });
  const [st, setSt] = useState({ busy: false, err: '', ok: '' });

  const load = () => supabase.from('center_legal').select('inn,org_form,legal_name,director_name,license_no,email,verified_at').eq('center_id', center.id).maybeSingle()
    .then(({ data }) => setD(data || null));
  useEffect(() => { setD(undefined); load(); }, [center.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function save(e) {
    e.preventDefault();
    const inn = digits(f.inn);
    if (!f.form) return setSt({ busy: false, err: 'Tashkiliy-huquqiy shaklni tanlang.', ok: '' });
    if (inn.length !== 9) return setSt({ busy: false, err: "STIR (INN) 9 ta raqamdan iborat bo'lishi kerak.", ok: '' });
    if (f.legal.trim().length < 2) return setSt({ busy: false, err: 'Yuridik nomni kiriting.', ok: '' });
    if (f.director.trim().length < 2) return setSt({ busy: false, err: 'Rahbar ism familiyasini kiriting.', ok: '' });
    setSt({ busy: true, err: '', ok: '' });
    const { error } = await supabase.rpc('center_set_legal', {
      p_center: center.id, p_inn: inn, p_org_form: f.form, p_legal_name: f.legal.trim(), p_director: f.director.trim(),
      p_license: f.license.trim() || null, p_email: f.email.trim() || null
    });
    if (error) return setSt({ busy: false, err: rpcMsg(error, "Saqlanmadi. Qayta urinib ko'ring."), ok: '' });
    setSt({ busy: false, err: '', ok: "Saqlandi. Ma'muriyat STIR'ni tekshirgach, «STIR tasdiqlangan» belgisi qo'yiladi." });
    load();
  }

  if (d === undefined) return <div className="card"><div className="sk sk-t" /></div>;
  if (d) {
    return (
      <div className="card stack legal-card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <b>Yuridik ma'lumotlar</b>
          <span className={'csu-badge ' + (d.verified_at ? 'ok' : 'wait')}>{d.verified_at ? 'STIR tasdiqlangan' : 'Tekshirilmoqda'}</span>
        </div>
        <dl className="csu-sum">
          <dt>Tashkilot</dt><dd>{`${d.legal_name} · ${d.org_form}`}</dd>
          <dt>STIR (INN)</dt><dd>{fmtInn(d.inn)}</dd>
          {d.director_name ? <><dt>Rahbar</dt><dd>{d.director_name}</dd></> : null}
          {d.license_no ? <><dt>Ruxsatnoma</dt><dd>{d.license_no}</dd></> : null}
          {d.email ? <><dt>E-pochta</dt><dd>{d.email}</dd></> : null}
        </dl>
        <p className="muted small">{d.org_form === 'YaTT' ? "Saytda STIR raqamingiz ko'rsatilmaydi, faqat «tasdiqlangan» belgisi chiqadi." : "Markaz sahifasida yuridik nomi va STIR ko'rsatiladi — bu ota-onalar ishonchini oshiradi."} O'zgartirish uchun sayt ma'muriyatiga murojaat qiling.</p>
      </div>
    );
  }
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  return (
    <form className="card stack legal-card" onSubmit={save} noValidate>
      <b>Yuridik ma'lumotlar</b>
      <p className="note" style={{ margin: 0 }}>Markazingiz STIR (INN) raqamini kiriting. Bu hamkorlik shartnomasi va oylik hisob uchun kerak. Bir marta kiritiladi.</p>
      <div className="two">
        <label>Tashkiliy-huquqiy shakli
          <select value={f.form} onChange={set('form')}>
            <option value="">Tanlang</option>
            {ORG_FORMS.map(([k, t]) => <option key={k} value={k}>{t}</option>)}
          </select>
        </label>
        <label>STIR (INN)<input value={fmtInn(f.inn)} onChange={(e) => setF((x) => ({ ...x, inn: digits(e.target.value).slice(0, 9) }))} inputMode="numeric" placeholder="123 456 789" /></label>
      </div>
      <label>Yuridik nomi<input value={f.legal} onChange={set('legal')} maxLength={200} placeholder="Masalan: «BILIM AKADEMIYASI» MChJ" /></label>
      <div className="two">
        <label>Rahbar ism familiyasi<input value={f.director} onChange={set('director')} maxLength={120} /></label>
        <label>Ruxsatnoma raqami (ixtiyoriy)<input value={f.license} onChange={set('license')} maxLength={60} /></label>
      </div>
      <label>Elektron pochta (ixtiyoriy)<input type="email" value={f.email} onChange={set('email')} maxLength={120} /></label>
      <div className="row" style={{ justifyContent: 'flex-start' }}><button className="btn sm" disabled={st.busy}>{st.busy ? 'Saqlanmoqda…' : 'Saqlash'}</button></div>
      {st.err ? <div className="formmsg err" role="alert">{st.err}</div> : null}
      {st.ok ? <div className="formmsg ok" role="status">{st.ok}</div> : null}
    </form>
  );
}
