'use client';
import { useEffect, useState } from 'react';
import { promptInstall, isStandalone, isIOS } from './PwaSetup';

// /ilova sahifasidagi o'rnatish tugmasi: qurilmaga qarab to'g'ri yo'l-yo'riq beradi
export default function InstallButton() {
  const [st, setSt] = useState('wait'); // wait | ready | ios | installed | other
  useEffect(() => {
    const upd = () => {
      if (isStandalone()) return setSt('installed');
      if (window.__esInstall) return setSt('ready');
      if (isIOS()) return setSt('ios');
      setSt('other');
    };
    upd();
    const t = setTimeout(upd, 1500);
    window.addEventListener('es-install', upd);
    window.addEventListener('appinstalled', () => setSt('installed'));
    return () => { clearTimeout(t); window.removeEventListener('es-install', upd); };
  }, []);
  if (st === 'installed') return <p className="ilova-ok">Ilova o'rnatilgan. Uni telefoningiz bosh ekranidan oching.</p>;
  if (st === 'ready') return <button type="button" className="btn ilova-btn" onClick={async () => { if ((await promptInstall()) === 'accepted') setSt('installed'); }}>Ilovani o'rnatish</button>;
  if (st === 'ios') return <p className="ilova-hint">iPhone'da: Safari'ning pastidagi «Ulashish» tugmasini bosing va «Bosh ekranga» ni tanlang.</p>;
  if (st === 'other') return <p className="ilova-hint">Brauzer menyusidan (⋮) «Ilovani o'rnatish» yoki «Bosh ekranga qo'shish» ni tanlang.</p>;
  return null;
}
