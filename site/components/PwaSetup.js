'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

// Ilova: service worker'ni ulaydi va telefonda "Ilovani o'rnatish" taklifini ko'rsatadi
const DISMISS = 'es-install-dismissed';
const DAYS = 14;

export const isStandalone = () => typeof window !== 'undefined' && (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true);
export const isIOS = () => typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios|edgios/i.test(navigator.userAgent);
const inApp = () => typeof navigator !== 'undefined' && /telegram|instagram|fban|fbav|line\//i.test(navigator.userAgent);

// O'rnatish oynasini boshqa komponentlar ham chaqira oladi (/ilova sahifasidagi tugma)
export async function promptInstall() {
  const p = typeof window !== 'undefined' ? window.__esInstall : null;
  if (!p) return 'unavailable';
  p.prompt();
  const r = await p.userChoice.catch(() => null);
  window.__esInstall = null;
  window.dispatchEvent(new Event('es-install'));
  return r?.outcome || 'dismissed';
}

export default function PwaSetup() {
  const path = usePathname() || '/';
  const [show, setShow] = useState(null); // null | 'android' | 'ios'

  useEffect(() => {
    if ('serviceWorker' in navigator && location.hostname !== 'localhost') {
      const reg = () => navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
      if (document.readyState === 'complete') reg(); else window.addEventListener('load', reg, { once: true });
    }
    if (isStandalone()) return;
    let dismissed = 0;
    try { dismissed = Number(localStorage.getItem(DISMISS)) || 0; } catch {}
    const recently = Date.now() - dismissed < DAYS * 864e5;
    const onPrompt = (e) => {
      e.preventDefault();
      window.__esInstall = e;
      window.dispatchEvent(new Event('es-install'));
      if (!recently && window.innerWidth < 760) setShow('android');
    };
    const onInstalled = () => { window.__esInstall = null; setShow(null); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    let t;
    if (!recently && isIOS() && !inApp()) t = setTimeout(() => setShow('ios'), 12000);
    return () => { window.removeEventListener('beforeinstallprompt', onPrompt); window.removeEventListener('appinstalled', onInstalled); clearTimeout(t); };
  }, []);

  if (!show || path.startsWith('/boshqaruv') || path.startsWith('/ilova')) return null;
  const close = () => { try { localStorage.setItem(DISMISS, String(Date.now())); } catch {} setShow(null); };
  return (
    <div className="pwa-ask" role="dialog" aria-label="Ilovani o'rnatish">
      <img src="/icons/icon-192.png" alt="" width="48" height="48" />
      <div className="pwa-t">
        <b>EduSearcher ilovasi</b>
        {show === 'ios'
          ? <small>Pastdagi <span className="ios-share" aria-label="Ulashish" /> tugmasini bosing, so'ng «Bosh ekranga» ni tanlang</small>
          : <small>Telefoningizga o'rnating: tezroq ochiladi, internetsiz ham ishlaydi</small>}
      </div>
      {show === 'android' ? <button type="button" className="pwa-go" onClick={async () => { const r = await promptInstall(); if (r !== 'accepted') close(); else setShow(null); }}>O'rnatish</button> : null}
      <button type="button" className="pwa-x" onClick={close} aria-label="Yopish">×</button>
    </div>
  );
}
