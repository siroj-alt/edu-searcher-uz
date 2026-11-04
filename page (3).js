import { supabase } from '../../../lib/supabase';
import { LEVELS } from '../../../lib/levels';

export const dynamic = 'force-dynamic';

export default async function Center({ params }) {
  const { data: c } = await supabase
    .from('centers')
    .select('*, branches(id,address,phone), courses(id,name,level,price_monthly,schedule,duration_months,categories(name))')
    .eq('id', params.id)
    .single();
  if (!c) return <div className="wrap page"><p>Markaz topilmadi.</p></div>;

  return (
    <div className="wrap page">
      <div className="sec"><h2>{c.name}</h2><i /></div>
      <p className="muted" style={{ maxWidth: '70ch' }}>{c.description}</p>
      <p style={{ margin: '12px 0' }}>
        {c.is_verified && <span className="tag on">Tasdiqlangan</span>}
        <span className="tag">★ {Number(c.rating).toFixed(1)}</span>
        {c.telegram && <a className="tag" href={c.telegram}>Telegram</a>}
        {c.website && <a className="tag" href={c.website}>Veb-sayt</a>}
      </p>
      <div className="sec"><h2>Filiallar</h2><i /></div>
      {c.branches.map((b) => (
        <div className="card" key={b.id}>{b.address}{b.phone && <span className="muted"> · {b.phone}</span>}</div>
      ))}
      <div className="sec"><h2>Kurslar</h2><i /></div>
      <div className="grid2">
        {c.courses.map((k) => (
          <div className="card" key={k.id} style={{ marginBottom: 0 }}>
            <span className="tag">{k.categories?.name}</span><span className="tag">{LEVELS[k.level]}</span>
            <h3 style={{ margin: '6px 0' }}>{k.name}</h3>
            <p className="muted">{k.schedule || 'Jadval aniqlashtiriladi'}{k.duration_months ? ` · ${k.duration_months} oy` : ''}</p>
            <p style={{ marginTop: 8 }}>{k.price_monthly ? k.price_monthly.toLocaleString('ru-RU') + " so'm/oy" : 'Narx kelishiladi'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
