'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { useMe, signOut } from '../../lib/auth';
import Overview from './Overview';
import Students from './Students';
import Payments from './Payments';
import CenterInfo from './CenterInfo';
import Applications from '../shared/Applications';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FIELDS = 'id,name,description,contract_status,contract_end,contacts_visible,owner_id,logo_url,cover_url,is_hidden,is_verified';
const initials = (n) => String(n || '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'M';
const Ic = ({ d }) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>;
const ICONS = {
  umumiy: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  arizalar: 'M4 13l2.5-7h11L20 13M4 13v6h16v-6M4 13h4.5l1 2h5l1-2H20',
  oquvchilar: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M17 4.5a3.5 3.5 0 0 1 0 6.5M22 21a6 6 0 0 0-4-5.6',
  tolovlar: 'M3 7h18v12H3zM3 11h18M16 15h2',
  malumot: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  out: 'M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H4'
};

// O'quv markazining alohida boshqaruv paneli
export default function CenterPanel({ centerParam = '' }) {
  const me = useMe();
  const [centers, setCenters] = useState(null);
  const [cid, setCid] = useState('');
  const [tab, setTab] = useState('umumiy');
  const [ov, setOv] = useState(null);
  const [days, setDays] = useState(30);

  const loadCenters = useCallback(async () => {
    if (!me) return;
    let q = supabase.from('centers').select(FIELDS);
    q = me.role === 'admin' && UUID_RE.test(centerParam) ? q.eq('id', centerParam) : q.eq('owner_id', me.id);
    const { data } = await q.order('name').limit(50);
    setCenters(data || []);
    setCid((cur) => ((data || []).some((c) => c.id === cur) ? cur : (data || [])[0]?.id || ''));
  }, [me, centerParam]);
  useEffect(() => { loadCenters(); }, [loadCenters]);

  const loadOv = useCallback(async () => {
    if (!cid) return;
    const { data, error } = await supabase.rpc('center_overview', { p_center: cid, p_days: days });
    setOv(error ? { error: true, applications: {}, events: {}, daily: [], days } : data);
  }, [cid, days]);
  useEffect(() => { setOv(null); loadOv(); }, [loadOv]);

  if (me === undefined || (me && centers === null)) return <div className="wrap page"><div className="card muted">Yuklanmoqda...</div></div>;
  if (!me) {
    return (
      <div className="wrap page">
        <div className="card empty-state">
          <h1 className="h2">O'quv markazi kabineti</h1>
          <p className="muted">Markazingiz paneliga kirish uchun sizga berilgan login va parol bilan kiring.</p>
          <p style={{ marginTop: 14 }}><Link className="btn" href="/kirish?next=/markaz-kabineti">Kirish</Link></p>
        </div>
      </div>
    );
  }
  const center = centers.find((c) => c.id === cid);
  if (!center) {
    return (
      <div className="wrap page">
        <div className="card empty-state">
          <h1 className="h2">Bu hisobga o'quv markazi biriktirilmagan</h1>
          <p className="muted">Markazingiz uchun kabinet ochish yoki mavjud markazni hisobingizga biriktirish uchun sayt ma'muriyatiga murojaat qiling.</p>
          <p style={{ marginTop: 14 }}><Link className="btn ghost" href="/kabinet">Shaxsiy kabinet</Link></p>
        </div>
      </div>
    );
  }

  const expired = center.contract_status === 'expired' || (center.contract_end && new Date(center.contract_end + 'T23:59:59') < new Date());
  const nNew = ov?.applications?.new || 0, nPay = ov?.payments_pending || 0;
  const TABS = [['umumiy', 'Umumiy'], ['arizalar', 'Arizalar', nNew], ['oquvchilar', "O'quvchilar"], ['tolovlar', "To'lovlar", nPay], ['malumot', "Ma'lumotlar"]];
  const status = center.is_hidden ? ['off', 'Saytda yashirilgan'] : center.is_verified ? ['ok', 'Saytda ko\'rinadi · Tasdiqlangan'] : ['ok', 'Saytda ko\'rinadi'];
  return (
    <div className="wrap page cab">
      <header className="cab-top">
        <div className="cab-id">
          {center.logo_url ? <img className="cab-av" src={center.logo_url} alt="" /> : <span className="cab-av ph" aria-hidden="true">{initials(center.name)}</span>}
          <div className="cab-nm">
            <small>O'quv markazi kabineti</small>
            {centers.length > 1 ? (
              <select className="cpick" value={cid} onChange={(e) => { setCid(e.target.value); setTab('umumiy'); }} aria-label="Markazni tanlang">
                {centers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            ) : <h1>{center.name}</h1>}
            <span className={'cab-st ' + status[0]}><i aria-hidden="true" />{status[1]}</span>
          </div>
        </div>
        <div className="cab-acts">
          <Link className="cab-act" href={`/centers/${center.id}`} target="_blank"><Ic d={ICONS.eye} /><span>Saytda ko'rish</span></Link>
          <button type="button" className="cab-act" onClick={() => signOut()}><Ic d={ICONS.out} /><span>Chiqish</span></button>
        </div>
      </header>
      {expired ? <p className="formmsg err" style={{ marginBottom: 14 }}>Shartnoma muddati tugagan: tahrirlash va arizalar bilan ishlash vaqtincha yopiq. Sayt ma'muriyatiga murojaat qiling.</p> : null}
      <nav className="cab-nav" role="tablist" aria-label="Kabinet bo'limlari">
        {TABS.map(([k, v, n]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
            <span className="cab-ic"><Ic d={ICONS[k]} />{n ? <span className="cab-badge">{n > 99 ? '99+' : n}</span> : null}</span>
            <span className="cab-lb">{v}</span>
          </button>
        ))}
      </nav>

      {tab === 'umumiy' ? <Overview ov={ov} days={days} onDays={setDays} onTab={setTab} /> : null}
      {tab === 'arizalar' ? <Applications centerId={center.id} onChange={loadOv} /> : null}
      {tab === 'oquvchilar' ? <Students centerId={center.id} onChange={loadOv} /> : null}
      {tab === 'tolovlar' ? <Payments centerId={center.id} onChange={loadOv} /> : null}
      {tab === 'malumot' ? <CenterInfo center={center} onChange={loadCenters} /> : null}
    </div>
  );
}
