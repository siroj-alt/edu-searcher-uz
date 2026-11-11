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
const FIELDS = 'id,name,description,contract_status,contract_end,contacts_visible,owner_id';

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
  return (
    <div className="wrap page">
      <div className="cab-head">
        <div>
          <p className="muted" style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>O'quv markazi kabineti</p>
          {centers.length > 1 ? (
            <select className="cpick" value={cid} onChange={(e) => { setCid(e.target.value); setTab('umumiy'); }}>
              {centers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          ) : <h1 className="h1s">{center.name}</h1>}
        </div>
        <div className="row">
          <Link className="btn ghost sm" href={`/centers/${center.id}`} target="_blank">Saytda ko'rish</Link>
          <button type="button" className="btn ghost sm" onClick={() => signOut()}>Chiqish</button>
        </div>
      </div>
      {expired ? <p className="formmsg err" style={{ marginBottom: 14 }}>Shartnoma muddati tugagan: tahrirlash va arizalar bilan ishlash vaqtincha yopiq. Sayt ma'muriyatiga murojaat qiling.</p> : null}
      <div className="tabs">
        {TABS.map(([k, v, n]) => <button key={k} type="button" className={'tab' + (tab === k ? ' on' : '')} onClick={() => setTab(k)}>{v}{n ? <span className="tcnt">{n}</span> : null}</button>)}
      </div>

      {tab === 'umumiy' ? <Overview ov={ov} days={days} onDays={setDays} onTab={setTab} /> : null}
      {tab === 'arizalar' ? <Applications centerId={center.id} onChange={loadOv} /> : null}
      {tab === 'oquvchilar' ? <Students centerId={center.id} onChange={loadOv} /> : null}
      {tab === 'tolovlar' ? <Payments centerId={center.id} onChange={loadOv} /> : null}
      {tab === 'malumot' ? <CenterInfo center={center} onChange={loadCenters} /> : null}
    </div>
  );
}
