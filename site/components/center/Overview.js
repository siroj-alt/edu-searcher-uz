'use client';
import { fmtSum } from '../../lib/auth';

const KINDS = [['call', "Qo'ng'iroq"], ['website', 'Veb-sayt'], ['telegram', 'Telegram'], ['instagram', 'Instagram'], ['route', "Yo'l ko'rsatish"]];

// Markaz paneli: murojaatlar va qiziqish statistikasi
export default function Overview({ ov, days, onDays, onTab }) {
  if (!ov) return <div className="card muted">Yuklanmoqda...</div>;
  const a = ov.applications || {}, e = ov.events || {};
  const daily = ov.daily || [];
  const max = Math.max(1, ...daily.map((d) => d.views + d.apps));
  const cards = [
    ['Arizalar', a.total || 0, a.new ? `${a.new} tasi yangi — ko'rib chiqing` : `oxirgi ${ov.days} kunda: ${a.period || 0}`, 'arizalar', 'M4 13l2.5-7h11L20 13M4 13v6h16v-6M4 13h4.5l1 2h5l1-2H20', a.new ? 'hot' : ''],
    ["Sahifani ko'rganlar", e.viewers || 0, `jami ${e.views || 0} marta ochilgan`, '', 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', ''],
    ["Bog'lanishga urinish", e.contacts || 0, "qo'ng'iroq, sayt, Telegram", '', 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2', ''],
    ['Saqlab qo\'yganlar', ov.saved || 0, "markazingizni saqlaganlar", '', 'M6 3.5h12v17l-6-4-6 4z', ''],
    ["O'quvchilar", ov.students || 0, "hozir o'qiyotganlar", 'oquvchilar', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M17 4.5a3.5 3.5 0 0 1 0 6.5', ''],
    ["Shu oy to'lovlar", fmtSum(ov.paid_month || 0), ov.payments_pending ? `${ov.payments_pending} ta to'lov tasdiq kutmoqda` : 'tasdiqlangan tushum', 'tolovlar', 'M3 7h18v12H3zM3 11h18M16 15h2', ov.payments_pending ? 'hot' : '']
  ];
  return (
    <>
      <div className="ov-head">
        <h2>Statistika</h2>
        <div className="ov-seg" role="group" aria-label="Davr">
          {[7, 30, 90].map((d) => <button key={d} type="button" className={days === d ? 'on' : ''} aria-pressed={days === d} onClick={() => onDays(d)}>{d} kun</button>)}
        </div>
      </div>
      <div className="ovgrid">
        {cards.map(([t, v, s, tab, ic, hot]) => {
          const inner = (
            <>
              <span className="ov-ic" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={ic} /></svg></span>
              <span className="ov-t">{t}</span>
              <b>{v}</b>
              <small className="muted">{s}</small>
              {tab ? <span className="ov-go" aria-hidden="true">›</span> : null}
            </>
          );
          return tab
            ? <button key={t} type="button" className={'card ovcard link' + (hot ? ' hot' : '')} onClick={() => onTab(tab)}>{inner}</button>
            : <div key={t} className="card ovcard">{inner}</div>;
        })}
      </div>
      <p className="muted ov-note">Ko'rish va bog'lanishlar tanlangan davr bo'yicha, qolganlari jami.</p>

      <div className="sec"><h2>Kunlar bo'yicha</h2><i /></div>
      <div className="card">
        <div className="ovbars" role="img" aria-label="Kunlik ko'rishlar va arizalar">
          {daily.map((d) => (
            <div key={d.day} className="ovbar" title={`${String(d.day).slice(8, 10)}.${String(d.day).slice(5, 7)}: ${d.views} ta ko'rish, ${d.apps} ta ariza, ${d.contacts} ta aloqa`}>
              <i className="a" style={{ height: `${(d.apps / max) * 100}%` }} />
              <i className="v" style={{ height: `${(d.views / max) * 100}%` }} />
            </div>
          ))}
        </div>
        <div className="ovlegend"><span><i className="v" />Sahifa ko'rishlar</span><span><i className="a" />Arizalar</span></div>
      </div>

      <div className="sec"><h2>Aloqaga chiqishlar</h2><i /></div>
      <div className="stats">
        {KINDS.map(([k, v]) => <div key={k} className="card stat"><b>{e[k] || 0}</b><span className="muted">{v}</span></div>)}
      </div>
      <div className="sec"><h2>Arizalar holati</h2><i /></div>
      <div className="stats">
        {[['new', 'Yangi'], ['contacted', "Bog'lanildi"], ['accepted', 'Qabul qilingan'], ['rejected', 'Rad etilgan']].map(([k, v]) => <div key={k} className="card stat"><b>{a[k] || 0}</b><span className="muted">{v}</span></div>)}
      </div>
    </>
  );
}
