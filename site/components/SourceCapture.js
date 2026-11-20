'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { captureSource } from '../lib/utm';

const PRIVATE = /^\/(boshqaruv|kabinet|markaz-kabineti|kirish)/;

// 1) Reklama havolalaridagi UTM belgilarini eslab qoladi (ariza manbasini aniqlash uchun)
// 2) Sahifalar orasida o'tganda Yandex Metrikaga tashrif yuboradi (hisoblagich ulangan bo'lsa)
export default function SourceCapture() {
  const path = usePathname();
  const first = useRef(true);
  useEffect(() => { captureSource(); }, []);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    try {
      const id = window.__ES_YM;
      if (id && typeof window.ym === 'function' && !PRIVATE.test(path || '')) window.ym(id, 'hit', window.location.href);
    } catch {}
  }, [path]);
  return null;
}
