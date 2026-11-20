'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { rpcMsg } from '../../lib/auth';

// Google/Yandex butun <meta ...> tegini yoki faqat kodni qabul qiladi
const codeOf = (s) => {
  const t = String(s || '').trim();
  const m = t.match(/content\s*=\s*["']([^"']+)["']/i);
  return (m ? m[1] : t).trim();
};
// Metrika: butun skriptdan yoki havoladan hisoblagich raqamini ajratadi
const metricaOf = (s) => {
  const t = String(s || '').trim();
  const m = t.match(/ym\(\s*(\d{4,12})/) || t.match(/watch\/(\d{4,12})/) || t.match(/id=(\d{4,12})/) || t.match(/^(\d{4,12})$/);
  return m ? m[1] : t.replace(/\D/g, '');
};

const FIELDS = [
  { key: 'verify_google', label: 'Google Search Console kodi', hint: 'Search Console → Sozlamalar → Egalikni tasdiqlash → HTML teg. Butun tegni yoki faqat content qiymatini qo\'ying.', parse: codeOf, re: /^[A-Za-z0-9_-]{0,120}$/ },
  { key: 'verify_yandex', label: 'Yandex Webmaster kodi', hint: 'Yandex Webmaster → Huquqlarni tasdiqlash → Meta teg.', parse: codeOf, re: /^[A-Za-z0-9_-]{0,120}$/ },
  { key: 'metrica_id', label: 'Yandex Metrika hisoblagichi', hint: 'Hisoblagich raqami (masalan 98765432) yoki butun kod — raqami o\'zi ajratib olinadi.', parse: metricaOf, re: /^[0-9]{0,12}$/ }
];

export default function SiteSettings() {
  const [vals, setVals] = useState(null);
  const [msg, setMsg] = useState({});
  const [busy, setBusy] = useState('');

  useEffect(() => {
    supabase.from('site_settings').select('key,value').then(({ data }) => {
      const o = Object.fromEntries((data || []).map((x) => [x.key, x.value]));
      setVals({
        verify_google: o.verify_google || '', verify_yandex: o.verify_yandex || '', metrica_id: o.metrica_id || '',
        billing_rate: o.billing_rate != null ? String(Math.round(Number(o.billing_rate) * 100)) : '30',
        billing_flat: o.billing_flat != null ? String(o.billing_flat) : '80000'
      });
    });
  }, []);

  async function save(key, value) {
    setBusy(key); setMsg((m) => ({ ...m, [key]: null }));
    const { error } = await supabase.rpc('admin_set_setting', { p_key: key, p_value: value });
    setBusy('');
    setMsg((m) => ({ ...m, [key]: error ? { err: true, t: rpcMsg(error, "Saqlab bo'lmadi.") } : { t: 'Saqlandi. Saytda bir necha daqiqada ko\'rinadi.' } }));
  }

  function saveField(f) {
    const v = f.parse(vals[f.key]);
    if (!f.re.test(v)) { setMsg((m) => ({ ...m, [f.key]: { err: true, t: "Kod noto'g'ri ko'rinadi. Faqat harf, raqam, «-» va «_» bo'lishi kerak." } })); return; }
    setVals((s) => ({ ...s, [f.key]: v }));
    save(f.key, v);
  }

  function saveBilling(e) {
    e.preventDefault();
    const pct = Number(String(vals.billing_rate).replace(',', '.'));
    const flat = Number(String(vals.billing_flat).replace(/\D/g, ''));
    if (!(pct >= 0 && pct <= 100)) { setMsg((m) => ({ ...m, billing: { err: true, t: 'Ulush 0 dan 100 gacha bo\'lsin.' } })); return; }
    if (!(flat >= 0 && flat <= 10000000)) { setMsg((m) => ({ ...m, billing: { err: true, t: 'Qat\'iy summa 0 dan 10 000 000 gacha bo\'lsin.' } })); return; }
    (async () => {
      setBusy('billing');
      const a = await supabase.rpc('admin_set_setting', { p_key: 'billing_rate', p_value: Math.round(pct * 10) / 1000 });
      const b = a.error ? a : await supabase.rpc('admin_set_setting', { p_key: 'billing_flat', p_value: Math.round(flat) });
      setBusy('');
      setMsg((m) => ({ ...m, billing: b.error ? { err: true, t: rpcMsg(b.error, "Saqlab bo'lmadi.") } : { t: "Saqlandi. Hamkorlik sahifasi va oylik hisob yangi tarif bilan hisoblanadi." } }));
    })();
  }

  if (!vals) return <div className="card muted">Yuklanmoqda...</div>;
  const note = (k) => (msg[k] ? <div className={'formmsg ' + (msg[k].err ? 'err' : 'ok')} role={msg[k].err ? 'alert' : 'status'}>{msg[k].t}</div> : null);
  return (
    <div className="set-grid">
      <section className="card">
        <h2 className="h2">Qidiruv tizimlari va analitika</h2>
        {FIELDS.map((f) => (
          <form key={f.key} className="set-f" onSubmit={(e) => { e.preventDefault(); saveField(f); }}>
            <label htmlFor={'s-' + f.key}>{f.label}</label>
            <div className="set-row">
              <input id={'s-' + f.key} value={vals[f.key]} onChange={(e) => setVals((s) => ({ ...s, [f.key]: e.target.value }))} placeholder="Bo'sh qoldirsangiz o'chiriladi" autoComplete="off" spellCheck={false} />
              <button type="submit" className="btn sm" disabled={busy === f.key}>{busy === f.key ? '...' : 'Saqlash'}</button>
            </div>
            <small className="muted">{f.hint}</small>
            {note(f.key)}
          </form>
        ))}
      </section>
      <section className="card">
        <h2 className="h2">Hamkorlik tarifi</h2>
        <form className="set-f" onSubmit={saveBilling}>
          <label htmlFor="s-rate">Birinchi oylik to'lovdan ulush, %</label>
          <input id="s-rate" inputMode="decimal" value={vals.billing_rate} onChange={(e) => setVals((s) => ({ ...s, billing_rate: e.target.value }))} />
          <label htmlFor="s-flat">Kurs narxi noma'lum bo'lsa, qat'iy summa (so'm)</label>
          <input id="s-flat" inputMode="numeric" value={vals.billing_flat} onChange={(e) => setVals((s) => ({ ...s, billing_flat: e.target.value }))} />
          <button type="submit" className="btn sm" disabled={busy === 'billing'} style={{ marginTop: 10 }}>{busy === 'billing' ? '...' : 'Tarifni saqlash'}</button>
          {note('billing')}
        </form>
      </section>
    </div>
  );
}
