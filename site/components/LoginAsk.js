'use client';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';

// "Saqlash uchun kabinetga kiring" oynasi
export default function LoginAsk({ next = '/', onClose, title = 'Saqlash uchun kabinetga kiring', text = "Saqlangan markazlar shaxsiy kabinetingizda turadi va barcha qurilmalaringizda ko'rinadi." }) {
  const box = useRef(null);
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', k);
    box.current?.querySelector('a')?.focus();
    return () => document.removeEventListener('keydown', k);
  }, [onClose]);
  if (typeof document === 'undefined') return null;
  const href = '/kirish?next=' + encodeURIComponent(next);
  return createPortal(
    <div className="lask" role="presentation" onClick={(e) => { e.stopPropagation(); if (e.target === e.currentTarget) onClose(); }}>
      <div className="lask-box" role="dialog" aria-modal="true" aria-labelledby="lask-t" ref={box}>
        <span className="lask-ic" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M12 20.5s-7.5-4.6-9.3-9.4C1.5 7.8 3.6 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.4 0 5.5 3.3 4.3 6.6-1.8 4.8-9.3 9.4-9.3 9.4z" /></svg>
        </span>
        <h2 id="lask-t">{title}</h2>
        <p>{text}</p>
        <Link className="btn" href={href} onClick={onClose}>Kirish yoki ro'yxatdan o'tish</Link>
        <button type="button" className="btn ghost" onClick={onClose}>Hozir emas</button>
      </div>
    </div>,
    document.body
  );
}
