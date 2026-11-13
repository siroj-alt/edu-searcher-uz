'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { REGIONS } from '../lib/regions';

const norm = (t) => String(t || '').toLowerCase().replace(/[ʻʼ‘’`']/g, "'").replace(/\s+/g, ' ').trim();

// Bosh sahifadagi qidiruv: kurs yoki markaz nomi + viloyat
export default function HomeSearch({ cats = [] }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [region, setRegion] = useState('');

  function go(e) {
    e.preventDefault();
    const nq = norm(q);
    const cat = nq ? cats.find((c) => norm(c.name) === nq || norm(c.slug) === nq) || cats.find((c) => nq.length >= 3 && norm(c.name).startsWith(nq)) : null;
    const p = new URLSearchParams();
    if (cat) p.set('cat', String(cat.id));
    else if (nq) p.set('q', q.trim().slice(0, 60));
    if (region) p.set('region', region);
    router.push('/search' + (p.toString() ? '?' + p.toString() : ''));
  }

  return (
    <form className="hsearch" role="search" onSubmit={go}>
      <label className="hq">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></svg>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Kurs yoki markaz nomi" aria-label="Kurs yoki markaz nomi" maxLength={60} enterKeyHint="search" />
      </label>
      <span className="hdiv" aria-hidden="true" />
      <label className="hreg">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.3" /></svg>
        <select value={region} onChange={(e) => setRegion(e.target.value)} aria-label="Viloyat">
          <option value="">Butun O'zbekiston</option>
          {REGIONS.map((r) => <option key={r.slug} value={r.slug}>{r.name}</option>)}
        </select>
      </label>
      <button className="hgo" type="submit">Qidirish</button>
    </form>
  );
}
