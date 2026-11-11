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
    ['Murojaatlar (arizalar)', a.total || 0, a.new ? `${a.new} tasi yangi` : `oxirgi ${ov.days} kunda: ${a.period || 0}`, 'arizalar'],
    ['Qiziqish bildirganlar', e.viewers || 0, `sahifangiz ${e.views || 0} marta ko'rilgan`, ''],
    ['Aloqaga chiqishlar', e.contacts || 0, "telefon, sayt va ijtimoiy tarmoqlar", ''],
    ['Saqlab qo\'yganlar', ov.saved || 0, 'kabinetiga saqlagan foydalanuvchilar', ''],
    ["Faol o'quvchilar", ov.students || 0, 'hozir o\'qiyotganlar', 'oquvchilar'],
    ["Shu oy to'lovlar", fmtSum(ov.paid_month || 0), ov.payments_pending ? `${ov.payments_pending} ta to'lov tasdiq kutmoqda` : 'tasdiqlangan tushum', 'tolovlar']
  ];
  return (
    <>
      <div className="row" style={{ marginBottom: 12 }}>
        <p className="muted">Ko'rishlar va aloqaga chiqishlar oxirgi {ov.days} kun bo'yicha, qolganlari jami.</p>
        <div className="tabs" style={{ marginBottom: 0 }}>
          {[7, 30, 90].map((d) => <button key={d} type="button" className={'tab' + (days === d ? ' on' : '')} onClick={() => onDays(d)}>{d} kun</button>)}
        </div>
      </div>
      <div className="ovgrid">
        {cards.map(([t, v, s, tab]) => (
          <button key={t} type="button" className={'card ovcard' + (tab ? ' link' : '')} onClick={() => tab && onTab(tab)} disabled={!tab}>
            <span className="muted">{t}</span>
            <b>{v}</b>
            <small className="muted">{s}</small>
          </button>
        ))}
      </div>

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
