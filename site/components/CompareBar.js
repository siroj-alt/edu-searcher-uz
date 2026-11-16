'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getCompare, onCompareChange, clearCompare, MAX_COMPARE } from '../lib/compare';

// Taqqoslash uchun tanlangan markazlar: pastda suzuvchi shisha panel
export default function CompareBar() {
  const path = usePathname() || '/';
  const [list, setList] = useState([]);
  useEffect(() => { setList(getCompare()); return onCompareChange(setList); }, []);
  const hidden = !list.length || /^\/(taqqoslash|centers|boshqaruv|kabinet|markaz-kabineti|kirish)/.test(path);
  useEffect(() => {
    document.documentElement.classList.toggle('has-cmpbar', !hidden);
    return () => document.documentElement.classList.remove('has-cmpbar');
  }, [hidden]);
  if (hidden) return null;
  return (
    <div className="cmpbar glass" role="region" aria-label="Taqqoslash">
      <div className="cmpdots" aria-hidden="true">
        {Array.from({ length: MAX_COMPARE }, (_, i) => <i key={i} className={i < list.length ? 'on' : ''} />)}
      </div>
      <span className="cmptxt"><b>{list.length}</b> ta markaz tanlandi</span>
      <button type="button" className="cmpx" onClick={clearCompare} aria-label="Tanlovni tozalash">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>
      {list.length < 2
        ? <span className="cmpgo off">Yana bittasini tanlang</span>
        : <Link className="cmpgo" href={'/taqqoslash?ids=' + list.join(',')}>Taqqoslash</Link>}
    </div>
  );
}
