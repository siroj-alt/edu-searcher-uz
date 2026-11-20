'use client';

// "Narxni so'rash" / "Narx va jadvalni so'rash": sahifadagi so'rov formasini kerakli kurs bilan ochadi
export default function AskButton({ center, course = null, kind = 'price', className = 'btn ghost sm', children }) {
  const go = () => {
    try { window.dispatchEvent(new CustomEvent('es-ask', { detail: { center, course, kind } })); } catch {}
    const el = document.getElementById('ariza-forma') || document.getElementById('ariza');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  return <button type="button" className={className} onClick={go}>{children}</button>;
}
