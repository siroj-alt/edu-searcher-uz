'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getSaved, toggleSaved, onSavedChange } from '../lib/saved';
import { useMe } from '../lib/auth';
import { Heart } from './Glyphs';
import LoginAsk from './LoginAsk';

const PEND = 'es-pending-save';

// Markazni saqlash: faqat shaxsiy kabinetga kirgan foydalanuvchi uchun.
// Kirmagan bo'lsa, kabinetga kirish taklif qilinadi va kirgach shu sahifaga qaytadi.
export default function SaveButton({ id, compact = false, label = true }) {
  const me = useMe();
  const path = usePathname() || '/';
  const [on, setOn] = useState(false);
  const [ask, setAsk] = useState(false);
  useEffect(() => {
    setOn(getSaved().includes(id));
    return onSavedChange((list) => setOn(list.includes(id)));
  }, [id]);
  // Kabinetga kirib qaytgach, kirishdan oldin bosilgan markaz avtomatik saqlanadi
  useEffect(() => {
    if (!me) return;
    let pend = null;
    try { pend = sessionStorage.getItem(PEND); } catch {}
    if (pend !== id) return;
    try { sessionStorage.removeItem(PEND); } catch {}
    const t = setTimeout(() => { if (!getSaved().includes(id)) setOn(toggleSaved(id)); }, 800);
    return () => clearTimeout(t);
  }, [me, id]);
  const click = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (me === undefined) return; // hali tekshirilmoqda
    if (!me) { try { sessionStorage.setItem(PEND, id); } catch {} return setAsk(true); }
    setOn(toggleSaved(id));
  };
  const saved = on && !!me;
  const title = saved ? 'Saqlanganlardan olib tashlash' : 'Saqlash';
  return (
    <>
      <button type="button" className={'savebtn' + (compact ? ' ic' : '') + (saved ? ' on' : '')} onClick={click} aria-pressed={saved} aria-label={title} title={title}>
        <Heart />
        {label && !compact ? (saved ? 'Saqlangan' : 'Saqlash') : null}
      </button>
      {ask ? <LoginAsk next={path} onClose={() => setAsk(false)} /> : null}
    </>
  );
}
