// Sayt sozlamalaridan (admin → Sozlamalar) Google/Yandex tasdiqlash teglari va Yandex Metrika.
// Ma'lumot 5 daqiqa keshlanadi, shuning uchun har sahifa ochilishida bazaga so'rov ketmaydi.
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xmdxmfvrzbfjursksfhv.supabase.co';
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_BVrfkdIa6RfE2vCD761KUg_YG4Rn51u';
const SAFE = /^[A-Za-z0-9_-]{1,120}$/;

async function settings() {
  try {
    const r = await fetch(`${URL_}/rest/v1/site_settings?select=key,value&key=in.(verify_google,verify_yandex,metrica_id)`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
      next: { revalidate: 300 }
    });
    if (!r.ok) return {};
    const rows = await r.json();
    return Object.fromEntries((rows || []).map((x) => [x.key, typeof x.value === 'string' ? x.value : '']));
  } catch {
    return {};
  }
}

export default async function SiteMeta() {
  const s = await settings();
  const g = SAFE.test(s.verify_google || '') ? s.verify_google : '';
  const y = SAFE.test(s.verify_yandex || '') ? s.verify_yandex : '';
  const m = /^\d{4,12}$/.test(s.metrica_id || '') ? s.metrica_id : '';
  const ym = m ? `(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");window.__ES_YM=${m};if(!/^\\/(boshqaruv|kabinet|markaz-kabineti|kirish)/.test(location.pathname)){ym(${m},"init",{clickmap:true,trackLinks:true,accurateTrackBounce:true,defer:true});ym(${m},"hit",location.href,{referer:document.referrer});}` : '';
  return (
    <>
      {g ? <meta name="google-site-verification" content={g} /> : null}
      {y ? <meta name="yandex-verification" content={y} /> : null}
      {ym ? <script dangerouslySetInnerHTML={{ __html: ym }} /> : null}
    </>
  );
}
