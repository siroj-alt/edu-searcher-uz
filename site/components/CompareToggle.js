'use client';
import { useEffect, useState } from 'react';
import { getCompare, toggleCompare, onCompareChange, MAX_COMPARE } from '../lib/compare';
import { toast } from './Toast';

// "Taqqoslash" belgisi: markazni taqqoslash ro'yxatiga qo'shadi yoki olib tashlaydi
export default function CompareToggle({ id, variant = 'chip' }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    setOn(getCompare().includes(id));
    return onCompareChange((l) => setOn(l.includes(id)));
  }, [id]);
  const click = (e) => {
    e.preventDefault(); e.stopPropagation();
    const r = toggleCompare(id);
    if (r === 'full') toast(`Ko'pi bilan ${MAX_COMPARE} ta markazni taqqoslash mumkin`);
  };
  return (
    <button type="button" className={'cmpt ' + variant + (on ? ' on' : '')} onClick={click} aria-pressed={on} title={on ? "Taqqoslashdan olib tashlash" : "Taqqoslashga qo'shish"}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {on ? <path d="M5 12.5l4.5 4.5L19 7.5" /> : <><path d="M8 4v16M16 4v16" /><path d="M4 8h8M12 16h8" /></>}
      </svg>
      <span>Taqqoslash</span>
    </button>
  );
}
