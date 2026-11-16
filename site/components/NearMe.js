'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from './Toast';
import { buildSearch } from './FilterSheet';

// "Menga yaqin": bir bosishda joylashuvni olib, eng yaqin markazlarni ko'rsatadi
export default function NearMe({ params = {}, active = false }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const go = () => {
    if (active) return router.push(buildSearch({ ...params, lat: '', lng: '', sort: params.sort === 'near' ? '' : params.sort, km: params.region ? params.km : '' }));
    if (!navigator.geolocation) return toast("Brauzeringiz joylashuvni qo'llamaydi");
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setBusy(false);
        router.push(buildSearch({ ...params, lat: p.coords.latitude.toFixed(5), lng: p.coords.longitude.toFixed(5), sort: 'near' }));
      },
      () => { setBusy(false); toast("Joylashuvga ruxsat berilmadi. Brauzer sozlamasida ruxsat bering."); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 120000 }
    );
  };
  return (
    <button type="button" className={'nearme' + (active ? ' on' : '')} onClick={go} disabled={busy} aria-pressed={active}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
        {busy ? <path d="M12 3a9 9 0 1 0 9 9" className="spin" /> : <><circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></>}
      </svg>
      {busy ? 'Aniqlanmoqda…' : 'Menga yaqin'}
    </button>
  );
}
