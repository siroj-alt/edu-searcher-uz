import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { LEVELS } from '../../lib/levels';
import SearchForm from '../../components/SearchForm';

export const dynamic = 'force-dynamic';

export default async function Search({ searchParams }) {
  const { cat, slug, level = 'beginner', km = '15' } = searchParams;
  let catId = cat;
  if (!catId && slug) {
    const { data } = await supabase.from('categories').select('id').eq('slug', slug).single();
    catId = data?.id;
  }
  if (!catId) {
    return (
      <div className="wrap page">
        <div className="sec"><h2>Mos markazni toping</h2><i /></div>
        <SearchForm />
      </div>
    );
  }

  const hasPos = searchParams.lat && searchParams.lng;
  const lat = hasPos ? +searchParams.lat : 41.3111;
  const lng = hasPos ? +searchParams.lng : 69.2797;
  const { data, error } = await supabase.rpc('recommend_courses', {
    p_category_id: +catId, p_level: level, p_lat: lat, p_lng: lng, p_max_km: +km, p_limit: 30
  });
  const q = (o) => '?' + new URLSearchParams({ cat: catId, level, km, ...(hasPos ? { lat: searchParams.lat, lng: searchParams.lng } : {}), ...o });

  return (
    <div className="wrap page">
      <div className="sec"><h2>Tavsiya etilgan markazlar</h2><i /></div>
      <div>
        {Object.entries(LEVELS).map(([k, v]) => (
          <Link key={k} href={q({ level: k })} className={`tag ${k === level ? 'on' : ''}`}>{v}</Link>
        ))}
        {['15', '50', '300'].map((r) => (
          <Link key={r} href={q({ km: r })} className={`tag ${r === km ? 'on' : ''}`}>{r} km gacha</Link>
        ))}
      </div>
      {!hasPos && <p className="muted" style={{ margin: '10px 0' }}>Joylashuv berilmagan, masofa Toshkent markazidan hisoblandi. Aniq natija uchun <Link href="/#finder" className="ok">joylashuvingizni yoqing</Link>.</p>}
      {error && <p className="err">Xatolik: {error.message}</p>}
      {!error && data?.length === 0 && <div className="card">Bu shartlarga mos markaz topilmadi. Radiusni kengaytiring yoki boshqa daraja tanlang.</div>}
      <div className="grid2" style={{ marginTop: 14 }}>
        {(data || []).map((r) => (
          <Link key={r.course_id + r.branch_id} href={`/centers/${r.center_id}`} className="card" style={{ marginBottom: 0 }}>
            <div className="row"><b>{r.center_name}</b><span className="km">{r.distance_km.toFixed(1)} km</span></div>
            <h3 style={{ margin: '6px 0' }}>{r.course_name}</h3>
            <p className="muted">{r.address}</p>
            <p className="muted">{r.schedule || 'Jadval markazdan aniqlashtiriladi'}</p>
            <p style={{ marginTop: 10 }}>
              ★ {Number(r.rating).toFixed(1)} · {r.price_monthly ? r.price_monthly.toLocaleString('ru-RU') + " so'm/oy" : 'Narx kelishiladi'}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
