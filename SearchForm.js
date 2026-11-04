'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { LEVELS } from '../lib/levels';

export default function SearchForm() {
  const router = useRouter();
  const [cats, setCats] = useState([]);
  const [cat, setCat] = useState('');
  const [level, setLevel] = useState('beginner');
  const [pos, setPos] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    supabase.from('categories').select('id,name').order('name').then(({ data }) => setCats(data || []));
  }, []);

  function locate() {
    if (!navigator.geolocation) return setMsg("Brauzeringiz joylashuvni qo'llamaydi.");
    navigator.geolocation.getCurrentPosition(
      (p) => { setPos({ lat: p.coords.latitude, lng: p.coords.longitude }); setMsg('Joylashuv aniqlandi.'); },
      () => setMsg("Joylashuvga ruxsat berilmadi. Toshkent markazidan hisoblaymiz.")
    );
  }

  function go(e) {
    e.preventDefault();
    const q = new URLSearchParams({ cat, level });
    if (pos) { q.set('lat', pos.lat); q.set('lng', pos.lng); }
    router.push('/search?' + q.toString());
  }

  return (
    <form id="finder" className="finder" onSubmit={go}>
      <select required value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Kurs yo'nalishi">
        <option value="">Kurs yo'nalishi</option>
        {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <select value={level} onChange={(e) => setLevel(e.target.value)} aria-label="Daraja">
        {Object.entries(LEVELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
      <button type="button" className="btn ghost full" onClick={locate}>
        {pos ? 'Joylashuv olindi' : 'Joylashuvimni aniqlash'}
      </button>
      <button className="btn full">Markazlarni topish</button>
      {msg && <p className="muted full">{msg}</p>}
    </form>
  );
}
