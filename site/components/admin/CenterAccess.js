'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { rpcMsg, normLogin } from '../../lib/auth';
import ContactsEditor from '../shared/ContactsEditor';

const TR = { 'ʻ': '', 'ʼ': '', '‘': '', '’': '', "'": '', 'ş': 's', 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ü': 'u' };
const suggest = (name) => String(name || '').toLowerCase().replace(/[ʻʼ‘’'şçğıöü]/g, (c) => TR[c] ?? '').replace(/[^a-z0-9]+/g, '').slice(0, 20) || 'markaz';
const randomPw = () => {
  const abc = 'abcdefghjkmnpqrstuvwxyz23456789';
  const a = new Uint32Array(10);
  (window.crypto || window.msCrypto).getRandomValues(a);
  return Array.from(a, (n) => abc[n % abc.length]).join('');
};

// Bosh admin: markazning aloqa ma'lumotlari, saytda ko'rinishi va markaz kabineti (login + parol)
export default function CenterAccess({ center, onMsg, onChange }) {
  const [owner, setOwner] = useState(undefined);
  const [f, setF] = useState({ login: '', password: '' });
  const [vis, setVis] = useState(center.contacts_visible !== false);
  const [busy, setBusy] = useState('');
  const [made, setMade] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    setVis(center.contacts_visible !== false); setErr('');
    if (!center.owner_id) { setOwner(null); setF({ login: suggest(center.name), password: '' }); return; }
    supabase.from('profiles').select('id,login,email').eq('id', center.owner_id).maybeSingle().then(({ data }) => {
      setOwner(data || { id: center.owner_id, login: null });
      setF({ login: data?.login || '', password: '' });
    });
  }, [center.id, center.owner_id, center.contacts_visible, center.name]);

  async function toggleVis(on) {
    setBusy('vis'); setErr('');
    const { error } = await supabase.rpc('admin_set_center_contacts_visible', { p_center: center.id, p_on: on });
    setBusy('');
    if (error) return setErr(rpcMsg(error));
    setVis(on); onMsg?.(on ? "Aloqa ma'lumotlari saytda ko'rsatiladi" : "Aloqa ma'lumotlari saytda yashirildi"); onChange?.();
  }

  async function saveAccount(e) {
    e.preventDefault(); setErr(''); setMade(null);
    const login = normLogin(f.login);
    if (!login) return setErr('Loginni kiriting.');
    if (!owner && f.password.length < 6) return setErr("Parol kamida 6 belgidan iborat bo'lsin.");
    setBusy('acc');
    const { error } = await supabase.rpc('admin_set_center_account', { p_center: center.id, p_login: login, p_password: f.password || null });
    setBusy('');
    if (error) return setErr(rpcMsg(error));
    if (f.password) setMade({ login, password: f.password });
    onMsg?.(owner ? 'Markaz kabineti yangilandi' : 'Markaz kabineti ochildi'); onChange?.();
  }

  async function resetPw(e) {
    e.preventDefault(); setErr(''); setMade(null);
    if (f.password.length < 6) return setErr("Yangi parol kamida 6 belgidan iborat bo'lsin.");
    setBusy('acc');
    const { error } = await supabase.rpc('admin_set_password', { p_user: owner.id, p_password: f.password });
    setBusy('');
    if (error) return setErr(rpcMsg(error));
    setMade({ login: owner.login || owner.email, password: f.password });
    setF({ ...f, password: '' }); onMsg?.('Parol yangilandi');
  }

  async function detach() {
    if (!confirm("Markaz kabinetini uzasizmi? Markaz egasi endi bu markazni boshqara olmaydi.")) return;
    setBusy('acc'); setErr(''); setMade(null);
    const { error } = await supabase.rpc('admin_remove_center_account', { p_center: center.id });
    setBusy('');
    if (error) return setErr(rpcMsg(error));
    onMsg?.('Markaz kabineti uzildi'); onChange?.();
  }

  return (
    <div className="subform" style={{ marginTop: 16 }}>
      <b>Aloqa ma'lumotlari</b>
      <ContactsEditor centerId={center.id} onSaved={onChange} />
      <label className="tgl">
        <input type="checkbox" checked={vis} disabled={busy === 'vis'} onChange={(e) => toggleVis(e.target.checked)} />
        Veb-sayt, telefon, Telegram va Instagram saytda ko'rinsin
      </label>

      <b style={{ marginTop: 6 }}>Markaz kabineti</b>
      {owner === undefined ? <p className="muted">Yuklanmoqda...</p> : owner ? (
        <form className="stack" onSubmit={resetPw}>
          <p className="muted">Kabinet ochilgan. Login: <b style={{ color: 'var(--text)' }}>{owner.login || owner.email || '—'}</b>. Markaz egasi <b style={{ color: 'var(--text)' }}>edusearcher.uz/kirish</b> sahifasidan kiradi.</p>
          <div className="two">
            <label>Yangi parol<input value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} maxLength={72} autoComplete="off" placeholder="Parolni yangilash uchun" /></label>
            <div className="row" style={{ alignSelf: 'end', justifyContent: 'flex-start' }}>
              <button type="button" className="btn ghost sm" onClick={() => setF({ ...f, password: randomPw() })}>Parol yaratish</button>
              <button className="btn sm" disabled={busy === 'acc'}>Parolni yangilash</button>
            </div>
          </div>
          <div className="row" style={{ justifyContent: 'flex-start' }}>
            <a className="btn ghost sm" href={`/markaz-kabineti?id=${center.id}`} target="_blank" rel="noopener noreferrer">Markaz panelini ochish</a>
            <button type="button" className="btn ghost sm" disabled={busy === 'acc'} onClick={detach}>Kabinetni uzish</button>
          </div>
        </form>
      ) : (
        <form className="stack" onSubmit={saveAccount}>
          <p className="muted">Markazga alohida panel ochish uchun login va parol yarating, so'ng ularni markazga yetkazing.</p>
          <div className="two">
            <label>Login<input value={f.login} onChange={(e) => setF({ ...f, login: e.target.value })} maxLength={30} autoCapitalize="none" autoComplete="off" /></label>
            <label>Parol<input value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} maxLength={72} autoComplete="off" /></label>
          </div>
          <div className="row" style={{ justifyContent: 'flex-start' }}>
            <button type="button" className="btn ghost sm" onClick={() => setF({ ...f, password: randomPw() })}>Parol yaratish</button>
            <button className="btn sm" disabled={busy === 'acc'}>Kabinet ochish</button>
          </div>
        </form>
      )}
      {made ? <div className="formmsg ok">Markazga yetkazing — login: <b>{made.login}</b>, parol: <b>{made.password}</b>. Parol boshqa ko'rsatilmaydi.</div> : null}
      {err ? <div className="formmsg err">{err}</div> : null}
    </div>
  );
}
