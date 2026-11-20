'use client';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { rpcMsg } from '../../lib/auth';

const BOT = 'edusearcherbot';

// Telegram'ni kabinetga ulash: yangi arizalar, eslatmalar va haftalik hisobot botga keladi
export default function TgLink({ compact = false, forStudent = false }) {
  const [linked, setLinked] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [wait, setWait] = useState(false);
  const timer = useRef(null);

  const check = async () => {
    const { data } = await supabase.rpc('my_tg_status');
    const on = !!data?.linked;
    setLinked(on);
    return on;
  };
  useEffect(() => { check(); return () => clearInterval(timer.current); }, []);

  async function connect() {
    setErr(''); setBusy(true);
    const w = window.open('', '_blank');
    const { data, error } = await supabase.rpc('create_tg_link');
    setBusy(false);
    if (error || !data?.token) { if (w) w.close(); return setErr(rpcMsg(error, "Havola yaratilmadi. Qayta urinib ko'ring.")); }
    const url = `https://t.me/${BOT}?start=link_${data.token}`;
    if (w) w.location.href = url; else window.location.href = url;
    setWait(true);
    let n = 0;
    clearInterval(timer.current);
    timer.current = setInterval(async () => {
      n += 1;
      if ((await check()) || n > 60) { clearInterval(timer.current); setWait(false); }
    }, 3000);
  }

  async function disconnect() {
    if (!confirm("Telegram'ni kabinetdan uzasizmi? Xabarlar kelmay qoladi.")) return;
    setBusy(true);
    const { error } = await supabase.rpc('unlink_tg');
    setBusy(false);
    if (error) return setErr(rpcMsg(error, "Bajarilmadi."));
    setLinked(false);
  }

  if (linked === null) return null;
  if (compact && linked) return null;
  const what = forStudent
    ? "Kursga yozilganingizdan keyin darslar haqida qisqa so'rov va muhim xabarlar botga keladi."
    : "Yangi arizalar darhol, 24 soat javobsiz qolgan arizalar haqida eslatma va har dushanba haftalik hisobot keladi.";
  return (
    <div className={'card stack tglink' + (linked ? ' on' : '')}>
      <div className="tglink-h">
        <span className="tglink-ic" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 4L3 11l6 2.5L11.5 20l3-5 5.5 4z" /><path d="M9 13.5l6-4.5" /></svg></span>
        <div>
          <b>{linked ? "Telegram ulangan" : "Xabarlarni Telegram'da oling"}</b>
          <p className="muted small">{linked ? `@${BOT} orqali xabarlar keladi. ${what}` : what}</p>
        </div>
      </div>
      <div className="row" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {linked
          ? <button type="button" className="btn ghost sm" onClick={disconnect} disabled={busy}>Uzish</button>
          : <button type="button" className="btn sm" onClick={connect} disabled={busy}>{wait ? 'Botda «Start» ni bosing...' : "Telegram'ni ulash"}</button>}
      </div>
      {err ? <div className="formmsg err">{err}</div> : null}
    </div>
  );
}
