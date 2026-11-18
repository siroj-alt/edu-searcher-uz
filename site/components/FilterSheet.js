'use client';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { LEVELS } from '../lib/levels';
import { REGIONS } from '../lib/regions';
import { toast } from './Toast';

export const KMS = [0, 2, 5, 10, 25];
export const PRICES = [300000, 500000, 1000000];
const fmtSum = (n) => (n >= 1e6 ? (n / 1e6).toLocaleString('ru-RU') + ' mln' : Math.round(n / 1000) + ' ming');

export function buildSearch(v) {
  const q = new URLSearchParams();
  for (const k of ['q', 'cat', 'level', 'region', 'km', 'price', 'sort', 'lat', 'lng']) {
    const x = v[k];
    if (x !== undefined && x !== null && x !== '' && x !== 0) q.set(k, String(x));
  }
  const s = q.toString();
  return '/search' + (s ? '?' + s : '');
}

// Filtr: telefonda pastdan chiqadigan shisha oyna, kompyuterda o'rtada
export default function FilterSheet({ cats = [], init = {}, count = 0 }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [v, setV] = useState(init);
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const box = useRef(null);
  const set = (k, x) => setV((o) => ({ ...o, [k]: o[k] === x && k !== 'region' ? '' : x }));

  useEffect(() => { if (open) { setV(init); } }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!open) return;
    const k = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', k);
    const y = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    setTimeout(() => box.current?.querySelector('button')?.focus(), 30);
    return () => { document.removeEventListener('keydown', k); document.documentElement.style.overflow = y; };
  }, [open]);

  const hasRef = !!(v.lat && v.lng) || !!v.region;
  const locate = () => {
    if (!navigator.geolocation) return toast("Brauzeringiz joylashuvni qo'llamaydi");
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (p) => { setBusy(false); setV((o) => ({ ...o, lat: p.coords.latitude.toFixed(5), lng: p.coords.longitude.toFixed(5) })); },
      () => { setBusy(false); toast('Joylashuvga ruxsat berilmadi'); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 120000 }
    );
  };
  const apply = () => { setOpen(false); router.push(buildSearch({ ...v, km: hasRef ? v.km : '' })); };
  const reset = () => setV({ q: init.q || '' });
  const shownCats = more ? cats : cats.slice(0, 12);

  const sheet = open ? (
    <div className="fsheet-bg" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
      <section className="fsheet glass" role="dialog" aria-modal="true" aria-labelledby="fs-t" ref={box}>
        <div className="fs-grip" aria-hidden="true" />
        <header className="fs-head">
          <h2 id="fs-t">Filtr</h2>
          <button type="button" className="fs-x" onClick={() => setOpen(false)} aria-label="Yopish">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </header>
        <div className="fs-body">
          <fieldset className="fs-grp">
            <legend>Yo'nalish</legend>
            <div className="fs-chips">
              {shownCats.map((c) => (
                <button type="button" key={c.id} className={String(v.cat) === String(c.id) ? 'on' : ''} aria-pressed={String(v.cat) === String(c.id)} onClick={() => set('cat', String(c.id))}>{c.name}</button>
              ))}
              {cats.length > 12 ? <button type="button" className="more" onClick={() => setMore(!more)}>{more ? 'Kamroq' : `Yana ${cats.length - 12} ta`}</button> : null}
            </div>
          </fieldset>
          <fieldset className="fs-grp">
            <legend>Daraja</legend>
            <div className="fs-seg">
              {Object.entries(LEVELS).map(([k, t]) => (
                <button type="button" key={k} className={v.level === k ? 'on' : ''} aria-pressed={v.level === k} onClick={() => set('level', k)}>{t}</button>
              ))}
            </div>
          </fieldset>
          <fieldset className="fs-grp">
            <legend>Narx (oyiga)</legend>
            <div className="fs-seg four">
              <button type="button" className={!v.price ? 'on' : ''} aria-pressed={!v.price} onClick={() => setV((o) => ({ ...o, price: '' }))}>Barchasi</button>
              {PRICES.map((p) => (
                <button type="button" key={p} className={Number(v.price) === p ? 'on' : ''} aria-pressed={Number(v.price) === p} onClick={() => set('price', String(p))}>{`${fmtSum(p)} gacha`}</button>
              ))}
            </div>
          </fieldset>
          <fieldset className="fs-grp">
            <legend>Hudud</legend>
            <div className="fs-row">
              <label className="fs-sel">
                <span className="sr">Viloyat</span>
                <select value={v.region || ''} onChange={(e) => setV((o) => ({ ...o, region: e.target.value }))}>
                  <option value="">Butun O'zbekiston</option>
                  {REGIONS.map((r) => <option key={r.slug} value={r.slug}>{r.name}</option>)}
                </select>
              </label>
              <button type="button" className={'fs-loc' + (v.lat ? ' on' : '')} onClick={v.lat ? () => setV((o) => ({ ...o, lat: '', lng: '', sort: o.sort === 'near' ? '' : o.sort })) : locate} disabled={busy}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg>
                {busy ? 'Aniqlanmoqda…' : v.lat ? 'Joylashuvim ✓' : 'Joylashuvim'}
              </button>
            </div>
          </fieldset>
          <fieldset className="fs-grp" disabled={!hasRef}>
            <legend>Masofa</legend>
            <div className="fs-seg five">
              {KMS.map((k) => (
                <button type="button" key={k} className={Number(v.km || 0) === k ? 'on' : ''} aria-pressed={Number(v.km || 0) === k} onClick={() => setV((o) => ({ ...o, km: k ? String(k) : '' }))}>{k ? `${k} km` : 'Cheksiz'}</button>
              ))}
            </div>
            {!hasRef ? <p className="fs-note">Masofani tanlash uchun viloyatni yoki joylashuvingizni belgilang.</p> : null}
          </fieldset>
        </div>
        <footer className="fs-foot">
          <button type="button" className="fs-reset" onClick={reset}>Tozalash</button>
          <button type="button" className="fs-go" onClick={apply}>Natijalarni ko'rsatish</button>
        </footer>
      </section>
    </div>
  ) : null;

  return (
    <>
      <button type="button" className="fbtn" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-label={count ? `Filtr, ${count} ta tanlangan` : 'Filtr'}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M4 7h9M17 7h3M4 17h3M11 17h9" /><circle cx="15" cy="7" r="2" /><circle cx="9" cy="17" r="2" /></svg>
        <span className="fbtn-t">Filtr</span>
        {count ? <span className="fbtn-n">{count}</span> : null}
      </button>
      {sheet && typeof document !== 'undefined' ? createPortal(sheet, document.body) : null}
    </>
  );
}
