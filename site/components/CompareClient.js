'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCompare, removeCompare } from '../lib/compare';

// Manzilda markazlar ko'rsatilmagan bo'lsa: brauzerdagi tanlovni ochadi yoki bo'sh holatni ko'rsatadi
export default function CompareEmpty() {
  const router = useRouter();
  const [empty, setEmpty] = useState(false);
  useEffect(() => {
    const l = getCompare();
    if (l.length) router.replace('/taqqoslash?ids=' + l.join(','));
    else setEmpty(true);
  }, [router]);
  if (!empty) return <div className="skel-page" aria-busy="true"><div className="sk sk-h" /><div className="sk sk-card" /></div>;
  return (
    <div className="empty glass-soft">
      <span className="empty-ic" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 4v16M16 4v16" /><path d="M4 8h8M12 16h8" /></svg>
      </span>
      <h1 className="h2">Taqqoslash uchun markaz tanlanmagan</h1>
      <p className="muted">Markazlar ro'yxatida 2–3 ta markazning «Taqqoslash» tugmasini bosing, so'ng ularni shu yerda yonma-yon ko'rasiz.</p>
      <Link className="btn" href="/search">Markazlarni ko'rish</Link>
    </div>
  );
}

// Ustundagi "olib tashlash" tugmasi
export function CompareRemove({ id, ids }) {
  const router = useRouter();
  const click = () => {
    removeCompare(id);
    const rest = ids.filter((x) => x !== id);
    router.replace(rest.length ? '/taqqoslash?ids=' + rest.join(',') : '/taqqoslash');
  };
  return (
    <button type="button" className="cmprm" onClick={click} aria-label="Taqqoslashdan olib tashlash" title="Olib tashlash">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
    </button>
  );
}
