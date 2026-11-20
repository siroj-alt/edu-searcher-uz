'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { useMe, refreshMe, rpcMsg, validPhone, signOut, signUp, normLogin, LOGIN_RE } from '../lib/auth';
import { REGIONS } from '../lib/regions';
import { SECTIONS } from '../lib/sections';
import { ORG_FORMS, onlyDigits, fmtInn } from '../lib/legal';

const STATUS = { pending: "Ko'rib chiqilmoqda", approved: 'Tasdiqlangan', rejected: 'Rad etilgan' };
const fmtDate = (d) => new Date(d).toLocaleDateString('ru-RU');

// Markazlar uchun alohida ro'yxatdan o'tish: hisob → tashkilot (STIR) → markaz → tasdiqlash → admin tekshiruvi
export default function CenterSignup({ markaz = '' }) {
  const me = useMe();
  const [req, setReq] = useState(undefined);
  const [again, setAgain] = useState(false);
  const [flow, setFlow] = useState(false); // forma to'ldirilayotganda (hisob ochilgan zahoti ham) shu forma qoladi

  useEffect(() => {
    if (!me || me.role !== 'user') { setReq(null); return; }
    supabase.from('center_requests').select('id,center_name,status,admin_note,created_at,decided_at,inn,legal_name,org_form').eq('user_id', me.id).order('created_at', { ascending: false }).limit(1)
      .then(({ data }) => setReq(data?.[0] || null));
  }, [me]);

  const intro = (
    <div className="csu-intro">
      <span className="csu-kicker">O'quv markazlari uchun</span>
      <h1 className="h1s">Markazni ro'yxatdan o'tkazish</h1>
      <p className="muted">Bu bo'lim faqat o'quv markazlari uchun. Joylashtirish bepul: markazingiz qidiruvda va xaritada chiqadi, arizalar kabinetingizga va Telegram'ga keladi. To'lov faqat sayt orqali kelgan o'quvchi uchun — <Link href="/hamkorlik">hamkorlik shartlari</Link>.</p>
      <ul className="csu-need">
        <li>Tashkilotning STIR (INN) raqami — 9 ta raqam</li>
        <li>Yuridik nomi va rahbar ism familiyasi</li>
        <li>Markaz manzili, telefoni va yo'nalishlari</li>
      </ul>
    </div>
  );

  const wizard = (
    <Wizard me={me} markaz={markaz}
      onStart={() => setFlow(true)}
      onSent={(r) => { setReq(r); setAgain(false); setFlow(false); }} />
  );

  if (flow) return <div className="csu">{intro}{wizard}</div>;
  if (me === undefined || (me && me.role === 'user' && req === undefined)) {
    return <div className="csu">{intro}<div className="card"><div className="sk sk-t" /><div className="sk sk-s" style={{ marginTop: 10 }} /></div></div>;
  }
  if (me && me.role === 'center_owner') {
    return (
      <div className="csu">{intro}
        <div className="card stack csu-done">
          <b>Sizda markaz kabineti bor.</b>
          <p className="muted">Arizalar, o'quvchilar, yuridik ma'lumotlar va markaz sahifasi kabinetingizda.</p>
          <Link className="btn" href="/markaz-kabineti">Markaz kabinetiga o'tish</Link>
        </div>
      </div>
    );
  }
  if (me && me.role === 'admin') {
    return <div className="csu">{intro}<div className="card stack"><b>Siz administratorsiz.</b><p className="muted">Markazlar so'rovlari admin paneldagi «Markaz so'rovlari» bo'limida ko'rib chiqiladi.</p></div></div>;
  }
  if (req && req.status === 'pending') {
    return (
      <div className="csu">{intro}
        <div className="card stack csu-done">
          <span className="csu-badge wait">{STATUS.pending}</span>
          <b>«{req.center_name}» so'rovi yuborilgan ({fmtDate(req.created_at)}).</b>
          {req.inn ? <p className="muted">{`${req.org_form || ''} «${req.legal_name || ''}», STIR ${fmtInn(req.inn)}`}</p> : null}
          <p className="muted">Ma'muriyat STIR va ma'lumotlarni tekshirib, siz bilan telefon orqali bog'lanadi (odatda 1 ish kuni ichida). Tasdiqlangach, shu login va parol bilan markaz kabinetiga kirasiz.</p>
          <Link className="btn ghost" href="/kabinet">Shaxsiy kabinetga qaytish</Link>
        </div>
      </div>
    );
  }
  if (req && req.status === 'approved' && !again) {
    return (
      <div className="csu">{intro}
        <div className="card stack csu-done">
          <span className="csu-badge ok">{STATUS.approved}</span>
          <b>Markazingiz tasdiqlandi.</b>
          <p className="muted">Markaz kabinetini ochish uchun chiqib, qayta kiring.</p>
          <button type="button" className="btn" onClick={async () => { await signOut(); window.location.href = '/kirish?next=/markaz-kabineti'; }}>Qayta kirish</button>
        </div>
      </div>
    );
  }
  if (req && req.status === 'rejected' && !again) {
    return (
      <div className="csu">{intro}
        <div className="card stack csu-done">
          <span className="csu-badge bad">{STATUS.rejected}</span>
          <b>«{req.center_name}» so'rovi rad etildi.</b>
          {req.admin_note ? <p>{req.admin_note}</p> : null}
          <button type="button" className="btn" onClick={() => setAgain(true)}>Yangi so'rov yuborish</button>
        </div>
      </div>
    );
  }
  return <div className="csu">{intro}{wizard}</div>;
}

function Wizard({ me, markaz, onStart, onSent }) {
  // Hisob shu formada ochilsa ham bosqichlar o'zgarmasligi uchun boshlang'ich holat saqlanadi
  const [guest] = useState(!me);
  const madeAccount = useRef(false);
  const STEPS = guest ? ['Hisob', 'Tashkilot', 'Markaz', 'Tasdiqlash'] : ['Tashkilot', 'Markaz', 'Tasdiqlash'];
  const [step, setStep] = useState(0);
  const [acc, setAcc] = useState({ full_name: '', phone: '+998 ', login: '', password: '', password2: '' });
  const [org, setOrg] = useState({ form: '', inn: '', legal: '', director: '', license: '', email: '' });
  const [ctr, setCtr] = useState({ name: '', contact: me?.full_name || '', phone: me?.phone || '+998 ', telegram: '', region: '', district: '', address: '', note: '' });
  const [sel, setSel] = useState([]);
  const [pos, setPos] = useState(null);
  const [existing, setExisting] = useState(null);
  const [found, setFound] = useState([]);
  const [cats, setCats] = useState([]);
  const [dists, setDists] = useState([]);
  const [innSt, setInnSt] = useState(null);
  const [agree, setAgree] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [st, setSt] = useState({ busy: false, err: '' });
  const top = useRef(null);
  const started = useRef(false);

  const touch = () => { if (!started.current) { started.current = true; onStart(); } };
  const setA = (k) => (e) => { touch(); setAcc((x) => ({ ...x, [k]: e.target.value })); };
  const setO = (k) => (e) => { touch(); setOrg((x) => ({ ...x, [k]: e.target.value })); };
  const setC = (k) => (e) => { touch(); setCtr((x) => ({ ...x, [k]: e.target.value })); };

  useEffect(() => { supabase.from('categories').select('id,name,slug').order('id').then(({ data }) => setCats(data || [])); }, []);
  useEffect(() => {
    const r = REGIONS.find((x) => x.slug === ctr.region);
    if (!r) { setDists([]); return; }
    supabase.rpc('region_districts', { p_region: r.id }).then(({ data }) => setDists((data || []).slice().sort((a, b) => a.name.localeCompare(b.name))));
  }, [ctr.region]);
  // "Bu sizning markazingizmi?" havolasidan kelinsa — o'sha markaz oldindan tanlanadi
  useEffect(() => {
    if (!markaz) return;
    supabase.from('centers').select('id,name,owner_id').eq('id', markaz).maybeSingle().then(({ data }) => {
      if (data && !data.owner_id) { setExisting(data); setCtr((x) => ({ ...x, name: x.name || data.name })); }
    });
  }, [markaz]);
  useEffect(() => {
    const q = ctr.name.trim();
    if (existing || q.length < 3) { setFound([]); return; }
    const t = setTimeout(() => {
      supabase.from('centers').select('id,name,owner_id').ilike('name', `%${q.replace(/[%_]/g, '')}%`).is('owner_id', null).limit(5).then(({ data }) => setFound(data || []));
    }, 350);
    return () => clearTimeout(t);
  }, [ctr.name, existing]);
  // STIR jonli tekshiruvi: 9 ta raqam kiritilgach
  useEffect(() => {
    const v = onlyDigits(org.inn);
    if (v.length !== 9) { setInnSt(null); return; }
    let live = true;
    setInnSt({ loading: true });
    const t = setTimeout(() => {
      supabase.rpc('center_inn_check', { p_inn: v }).then(({ data, error }) => { if (live) setInnSt(error ? null : data); });
    }, 300);
    return () => { live = false; clearTimeout(t); };
  }, [org.inn]);
  // Mas'ul shaxs va telefon hisobdagidek bo'lsin (foydalanuvchi o'zgartirmagan bo'lsa)
  useEffect(() => {
    if (!guest) return;
    setCtr((x) => ({ ...x, contact: x.contact || acc.full_name, phone: x.phone.trim() === '+998' ? acc.phone : x.phone }));
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  const groups = useMemo(() => {
    const used = new Set();
    const g = SECTIONS.map((s) => ({ s, list: s.cats.map((sl) => cats.find((c) => c.slug === sl)).filter((c) => c && !used.has(c.id) && used.add(c.id)) }));
    const rest = cats.filter((c) => !used.has(c.id));
    if (rest.length) g.push({ s: { slug: 'boshqa', name: 'Boshqa' }, list: rest });
    return g.filter((x) => x.list.length);
  }, [cats]);
  const toggle = (id) => { touch(); setSel((l) => (l.includes(id) ? l.filter((x) => x !== id) : l.length >= 15 ? l : [...l, id])); };
  const locate = () => {
    if (!navigator.geolocation) return setSt({ busy: false, err: "Brauzeringiz joylashuvni qo'llamaydi." });
    navigator.geolocation.getCurrentPosition(
      (p) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setSt({ busy: false, err: "Joylashuvga ruxsat berilmadi. Manzilni yozib qoldiring, ma'muriyat xaritaga joylaydi." }),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const kind = STEPS[step];
  const region = REGIONS.find((x) => x.slug === ctr.region);
  const innDigits = onlyDigits(org.inn);

  function check(k) {
    if (k === 'Hisob') {
      if (acc.full_name.trim().length < 2) return "Mas'ul shaxs ism familiyasini kiriting.";
      if (!validPhone(acc.phone)) return "Telefon raqamini to'liq kiriting, masalan: +998 90 123 45 67";
      if (acc.login.trim() && !LOGIN_RE.test(normLogin(acc.login))) return "Login 3–30 ta lotin harfi yoki raqamdan iborat bo'lsin. Bo'sh qoldirsangiz, telefon raqamingiz login bo'ladi.";
      if (acc.password.length < 6) return "Parol kamida 6 belgidan iborat bo'lsin.";
      if (acc.password !== acc.password2) return 'Parollar bir xil emas.';
    }
    if (k === 'Tashkilot') {
      if (!org.form) return 'Tashkiliy-huquqiy shaklni tanlang.';
      if (innDigits.length !== 9) return "STIR (INN) 9 ta raqamdan iborat bo'lishi kerak.";
      if (innSt && innSt.valid === false) return "STIR noto'g'ri ko'rinadi. Guvohnomadagi raqamni tekshiring.";
      if (innSt?.taken && !existing) return `Bu STIR bilan «${innSt.center}» allaqachon ro'yxatdan o'tgan. Agar u sizniki bo'lsa, ma'muriyatga murojaat qiling.`;
      if (innSt?.pending) return "Bu STIR bilan boshqa so'rov ko'rib chiqilmoqda.";
      if (org.legal.trim().length < 2) return 'Yuridik nomni guvohnomadagidek kiriting.';
      if (org.director.trim().length < 2) return 'Rahbar ism familiyasini kiriting.';
      if (org.email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(org.email.trim())) return "Elektron pochta manzili noto'g'ri.";
    }
    if (k === 'Markaz') {
      if (ctr.name.trim().length < 2) return 'Markaz nomini kiriting.';
      if (ctr.contact.trim().length < 2) return "Mas'ul shaxs ismini kiriting.";
      if (!validPhone(ctr.phone)) return "Markaz telefonini to'liq kiriting, masalan: +998 90 123 45 67";
      if (!region) return 'Viloyatni tanlang.';
      if (!sel.length) return "Kamida bitta yo'nalishni tanlang.";
    }
    if (k === 'Tasdiqlash' && !agree) return "Ma'lumotlar to'g'riligini tasdiqlang va shartlarga rozilik bering.";
    return '';
  }

  const go = (n) => {
    setSt({ busy: false, err: '' });
    setStep(n);
    setTimeout(() => top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
  };
  function next(e) {
    e.preventDefault();
    const err = check(kind);
    if (err) return setSt({ busy: false, err });
    touch();
    go(step + 1);
  }

  async function submit(e) {
    e.preventDefault();
    for (let i = 0; i < STEPS.length; i++) {
      const err = check(STEPS[i]);
      if (err) { setStep(i); return setSt({ busy: false, err }); }
    }
    setSt({ busy: true, err: '' });
    if (guest && !madeAccount.current) {
      const login = (acc.login.trim() || acc.phone).trim();
      const err = await signUp({ login, password: acc.password, full_name: acc.full_name.trim(), phone: acc.phone.trim() });
      if (err) { setStep(0); return setSt({ busy: false, err }); }
      madeAccount.current = true;
      await refreshMe();
    }
    const { data, error } = await supabase.rpc('submit_center_request', {
      p_center_name: ctr.name.trim(), p_contact_name: ctr.contact.trim(), p_phone: ctr.phone.trim(), p_telegram: ctr.telegram.trim() || null,
      p_region: region.id, p_district: ctr.district ? Number(ctr.district) : null, p_address: ctr.address.trim() || null,
      p_lat: pos?.lat ?? null, p_lng: pos?.lng ?? null, p_categories: sel, p_note: ctr.note.trim() || null, p_existing: existing?.id || null,
      p_inn: innDigits, p_org_form: org.form, p_legal_name: org.legal.trim(), p_director: org.director.trim(),
      p_license: org.license.trim() || null, p_email: org.email.trim() || null
    });
    if (error) {
      // Hisob ochildi, lekin so'rov o'tmadi — foydalanuvchi endi kirgan, ma'lumotni tuzatib qayta yuboradi
      const msg = rpcMsg(error, "So'rov yuborilmadi. Birozdan so'ng qayta urinib ko'ring.");
      const at = /STIR|Yuridik|Rahbar|shakl|pochta|Ruxsatnoma/i.test(msg) ? STEPS.indexOf('Tashkilot') : STEPS.indexOf('Markaz');
      setStep(at >= 0 ? at : step);
      return setSt({ busy: false, err: madeAccount.current ? `Hisobingiz ochildi, lekin so'rov yuborilmadi: ${msg}` : msg });
    }
    onSent({ id: data, center_name: ctr.name.trim(), status: 'pending', created_at: new Date().toISOString(), inn: innDigits, legal_name: org.legal.trim(), org_form: org.form });
  }

  const formName = ORG_FORMS.find(([k]) => k === org.form)?.[1] || '';
  return (
    <div className="csu-wiz" ref={top}>
      <ol className="csu-steps2" aria-label="Ro'yxatdan o'tish bosqichlari">
        {STEPS.map((s, i) => (
          <li key={s} className={i === step ? 'on' : i < step ? 'done' : ''} aria-current={i === step ? 'step' : undefined}>
            <button type="button" disabled={i > step} onClick={() => i < step && go(i)}><i>{i < step ? '✓' : i + 1}</i><span>{s}</span></button>
          </li>
        ))}
      </ol>

      <form className="card stack csu-form" onSubmit={kind === 'Tasdiqlash' ? submit : next} noValidate>
        {kind === 'Hisob' ? (
          <>
            <h2 className="h2">Markaz uchun hisob</h2>
            <p className="muted">Shu login va parol bilan markaz kabinetiga kirasiz. <Link href="/kirish?next=/markaz-royxat">Hisobingiz bormi? Kirish</Link></p>
            <div className="two">
              <label>Mas'ul shaxs (ism familiya)<input value={acc.full_name} onChange={setA('full_name')} maxLength={80} autoComplete="name" placeholder="Masalan: Aziz Karimov" /></label>
              <label>Telefon raqam<input value={acc.phone} onChange={setA('phone')} maxLength={20} inputMode="tel" autoComplete="tel" /></label>
            </div>
            <label>Login (ixtiyoriy)<input value={acc.login} onChange={setA('login')} maxLength={30} autoCapitalize="none" autoCorrect="off" autoComplete="username" placeholder="Bo'sh qoldirsangiz, telefon raqamingiz login bo'ladi" /></label>
            <div className="two">
              <label>Parol (kamida 6 belgi)<input type={showPw ? 'text' : 'password'} value={acc.password} onChange={setA('password')} maxLength={72} autoComplete="new-password" /></label>
              <label>Parolni takrorlang<input type={showPw ? 'text' : 'password'} value={acc.password2} onChange={setA('password2')} maxLength={72} autoComplete="new-password" /></label>
            </div>
            <label className="chk"><input type="checkbox" checked={showPw} onChange={(e) => setShowPw(e.target.checked)} /> Parolni ko'rsatish</label>
          </>
        ) : null}

        {kind === 'Tashkilot' ? (
          <>
            <h2 className="h2">Tashkilot ma'lumotlari</h2>
            <p className="muted">Ma'lumotlar davlat ro'yxatidan o'tganlik guvohnomasidagidek bo'lsin. STIR saytda faqat yuridik shaxslar uchun ko'rsatiladi, YaTT raqami yashirin qoladi.</p>
            <label>Tashkiliy-huquqiy shakli
              <select value={org.form} onChange={setO('form')}>
                <option value="">Tanlang</option>
                {ORG_FORMS.map(([k, t]) => <option key={k} value={k}>{t}</option>)}
              </select>
            </label>
            <label>STIR (INN)
              <input value={fmtInn(org.inn)} onChange={(e) => { touch(); setOrg((x) => ({ ...x, inn: onlyDigits(e.target.value).slice(0, 9) })); }} inputMode="numeric" autoComplete="off" placeholder="123 456 789" aria-describedby="inn-st" />
            </label>
            <div id="inn-st" className="inn-st" aria-live="polite">
              {innDigits.length > 0 && innDigits.length < 9 ? <span className="muted">{`${innDigits.length} / 9 raqam`}</span>
                : innSt?.loading ? <span className="muted">Tekshirilmoqda…</span>
                : innSt?.valid === false ? <span className="bad">STIR noto'g'ri ko'rinadi</span>
                : innSt?.taken ? <span className="bad">{`Bu STIR bilan «${innSt.center}» ro'yxatdan o'tgan`}</span>
                : innSt?.pending ? <span className="bad">Bu STIR bilan boshqa so'rov ko'rib chiqilmoqda</span>
                : innSt?.valid ? <span className="ok">✓ STIR saytda band emas</span>
                : <span className="muted">STIR'ni bilmasangiz, <a href="https://orginfo.uz/" target="_blank" rel="noopener noreferrer">orginfo.uz</a> yoki my.soliq.uz orqali topishingiz mumkin.</span>}
            </div>
            <label>Yuridik nomi<input value={org.legal} onChange={setO('legal')} maxLength={200} placeholder={org.form === 'YaTT' ? 'Masalan: Karimov Aziz Bahodirovich' : 'Masalan: «BILIM AKADEMIYASI» MChJ'} /></label>
            <div className="two">
              <label>{org.form === 'YaTT' ? 'Tadbirkor ism familiyasi' : 'Rahbar (direktor) ism familiyasi'}<input value={org.director} onChange={setO('director')} maxLength={120} /></label>
              <label>Ta'lim faoliyati ruxsatnomasi raqami (ixtiyoriy)<input value={org.license} onChange={setO('license')} maxLength={60} placeholder="Litsenziya yoki xabarnoma raqami" /></label>
            </div>
            <label>Elektron pochta (ixtiyoriy)<input type="email" value={org.email} onChange={setO('email')} maxLength={120} autoComplete="email" placeholder="hisob va shartnoma uchun" /></label>
          </>
        ) : null}

        {kind === 'Markaz' ? (
          <>
            <h2 className="h2">Markaz ma'lumotlari</h2>
            <label>Markaz nomi (saytda ko'rinadigan)<input value={ctr.name} onChange={(e) => { setC('name')(e); setExisting(null); }} maxLength={120} placeholder="Masalan: Bilim Akademiyasi" /></label>
            {existing ? (
              <div className="csu-exist">Saytdagi «<b>{existing.name}</b>» markazi sizniki deb belgilandi. <button type="button" className="linkbtn" onClick={() => setExisting(null)}>Bekor qilish</button></div>
            ) : found.length ? (
              <div className="csu-found">
                <small>Markazingiz saytda bormi? Tanlang — ma'lumotlari saqlanib, kabinet sizga ochiladi:</small>
                {found.map((c) => <button type="button" key={c.id} className="chipbtn" onClick={() => { setExisting(c); setFound([]); }}>{c.name}</button>)}
              </div>
            ) : null}
            <div className="two">
              <label>Mas'ul shaxs<input value={ctr.contact} onChange={setC('contact')} maxLength={80} autoComplete="name" placeholder="Ism familiya" /></label>
              <label>Markaz telefoni<input value={ctr.phone} onChange={setC('phone')} maxLength={20} inputMode="tel" autoComplete="tel" /></label>
            </div>
            <label>Telegram (ixtiyoriy)<input value={ctr.telegram} onChange={setC('telegram')} maxLength={80} placeholder="@markaz_uz" autoCapitalize="none" /></label>
            <div className="two">
              <label>Viloyat
                <select value={ctr.region} onChange={(e) => { touch(); setCtr((x) => ({ ...x, region: e.target.value, district: '' })); }}>
                  <option value="">Tanlang</option>
                  {REGIONS.map((r) => <option key={r.slug} value={r.slug}>{r.name}</option>)}
                </select>
              </label>
              <label>Tuman yoki shahar
                <select value={ctr.district} onChange={setC('district')} disabled={!dists.length}>
                  <option value="">{ctr.region ? 'Tanlang' : 'Avval viloyatni tanlang'}</option>
                  {dists.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </label>
            </div>
            <label>Manzil<input value={ctr.address} onChange={setC('address')} maxLength={200} placeholder="Ko'cha, uy, mo'ljal" /></label>
            <button type="button" className={'btn ghost csu-loc' + (pos ? ' on' : '')} onClick={locate}>{pos ? 'Joylashuv belgilandi ✓' : "Markaz joylashuvini aniqlash (markazda turgan bo'lsangiz)"}</button>
            <fieldset className="csu-cats">
              <legend>Yo'nalishlar <small>{`${sel.length} ta tanlandi`}</small></legend>
              {groups.map((g) => (
                <div key={g.s.slug} className="csu-g">
                  <small>{g.s.name}</small>
                  <div className="fs-chips">
                    {g.list.map((c) => <button type="button" key={c.id} className={sel.includes(c.id) ? 'on' : ''} aria-pressed={sel.includes(c.id)} onClick={() => toggle(c.id)}>{c.name}</button>)}
                  </div>
                </div>
              ))}
            </fieldset>
            <label>Qo'shimcha ma'lumot (ixtiyoriy)<textarea value={ctr.note} onChange={setC('note')} maxLength={1000} rows={3} placeholder="Narxlar, dars vaqtlari, filiallar soni" /></label>
          </>
        ) : null}

        {kind === 'Tasdiqlash' ? (
          <>
            <h2 className="h2">Ma'lumotlarni tekshiring</h2>
            <dl className="csu-sum">
              {guest ? <><dt>Hisob</dt><dd>{`${acc.full_name} · ${acc.phone} · login: ${acc.login.trim() || 'telefon raqam'}`}</dd></> : <><dt>Hisob</dt><dd>{me?.full_name || me?.login || ''}</dd></>}
              <dt>Tashkilot</dt><dd>{`${org.legal} (${formName.split(' — ')[0]})`}</dd>
              <dt>STIR</dt><dd>{fmtInn(org.inn)}</dd>
              <dt>Rahbar</dt><dd>{org.director}</dd>
              {org.license ? <><dt>Ruxsatnoma</dt><dd>{org.license}</dd></> : null}
              <dt>Markaz</dt><dd>{ctr.name}{existing ? ' (saytdagi markaz)' : ''}</dd>
              <dt>Aloqa</dt><dd>{`${ctr.contact} · ${ctr.phone}${ctr.telegram ? ' · ' + ctr.telegram : ''}`}</dd>
              <dt>Manzil</dt><dd>{[region?.name, dists.find((d) => String(d.id) === String(ctr.district))?.name, ctr.address].filter(Boolean).join(', ')}{pos ? ' · joylashuv belgilangan' : ''}</dd>
              <dt>Yo'nalishlar</dt><dd>{cats.filter((c) => sel.includes(c.id)).map((c) => c.name).join(', ')}</dd>
            </dl>
            <label className="consent">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
              <span>Ma'lumotlar to'g'ri ekanini tasdiqlayman va <Link href="/hamkorlik" target="_blank">hamkorlik shartlari</Link>ga roziman. Ma'muriyat STIR va ma'lumotlarni tekshirish uchun men bilan bog'lanishi mumkin.</span>
            </label>
          </>
        ) : null}

        {st.err ? <div className="formmsg err" role="alert">{st.err}</div> : null}
        <div className="csu-nav">
          {step > 0 ? <button type="button" className="btn ghost" onClick={() => go(step - 1)} disabled={st.busy}>Orqaga</button> : <span />}
          <button className="btn" disabled={st.busy}>{kind === 'Tasdiqlash' ? (st.busy ? 'Yuborilmoqda…' : "Ro'yxatdan o'tish") : 'Davom etish'}</button>
        </div>
      </form>
    </div>
  );
}
