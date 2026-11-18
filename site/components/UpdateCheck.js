'use client';
import { useEffect } from 'react';

const MINE = process.env.ES_BUILD || '';

// Ilova yoki brauzer orqa fondan qaytganda sayt yangilangan bo'lsa, sahifa avtomatik yangilanadi
// (eski dizayn xotirada qolib ketmasligi uchun).
export default function UpdateCheck() {
  useEffect(() => {
    if (!MINE) return;
    let hiddenAt = 0, checking = false;
    const typing = () => { const a = document.activeElement; return a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName); };
    const check = async () => {
      if (checking) return;
      checking = true;
      try {
        const r = await fetch('/api/build', { cache: 'no-store' });
        const { build } = await r.json();
        if (build && build !== MINE && !typing()) window.location.reload();
      } catch {}
      checking = false;
    };
    const vis = () => {
      if (document.visibilityState === 'hidden') { hiddenAt = Date.now(); return; }
      if (hiddenAt && Date.now() - hiddenAt > 20000) check();
    };
    const show = (e) => { if (e.persisted) check(); };
    // Yangi service worker sahifani boshqarishni olganda (sayt yangilanganda) bir marta yangilanadi
    let had = !!navigator.serviceWorker?.controller, reloaded = false;
    const ctl = () => { if (had && !reloaded && !typing()) { reloaded = true; window.location.reload(); } had = true; };
    document.addEventListener('visibilitychange', vis);
    window.addEventListener('pageshow', show);
    navigator.serviceWorker?.addEventListener('controllerchange', ctl);
    return () => {
      document.removeEventListener('visibilitychange', vis);
      window.removeEventListener('pageshow', show);
      navigator.serviceWorker?.removeEventListener('controllerchange', ctl);
    };
  }, []);
  return null;
}
