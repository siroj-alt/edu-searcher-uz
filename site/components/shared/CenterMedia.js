'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';

// Markaz logotipi (ikonka) va karta rasmi — galereyadan alohida tanlanadi.
// Logotip: markaz sahifasidagi belgi, kartalardagi kichik belgi. Karta rasmi: bosh sahifa va qidiruvdagi markaz kartasi.
const BUCKET = 'center-photos';
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));

async function loadBitmap(file) {
  if ('createImageBitmap' in window) {
    try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch { /* quyidagi usul */ }
  }
  return await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('read'));
    img.src = URL.createObjectURL(file);
  });
}

// Rasmni markazidan kerakli nisbatda qirqib, kichraytirib WebP qiladi
async function cropTo(file, ratio, maxW, bg) {
  const bmp = await loadBitmap(file);
  const w = bmp.width || bmp.naturalWidth, h = bmp.height || bmp.naturalHeight;
  let sw = w, sh = Math.round(w / ratio);
  if (sh > h) { sh = h; sw = Math.round(h * ratio); }
  const sx = Math.round((w - sw) / 2), sy = Math.round((h - sh) / 2);
  const cw = Math.min(maxW, sw), ch = Math.round(cw / ratio);
  const c = document.createElement('canvas');
  c.width = cw; c.height = ch;
  const ctx = c.getContext('2d');
  if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, cw, ch); }
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bmp, sx, sy, sw, sh, 0, 0, cw, ch);
  if (bmp.close) bmp.close();
  let blob = await new Promise((r) => c.toBlob(r, 'image/webp', 0.86));
  let type = 'image/webp', ext = 'webp';
  if (!blob || blob.type !== 'image/webp') { blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.86)); type = 'image/jpeg'; ext = 'jpg'; }
  return { blob, type, ext };
}

const pathOf = (url) => { const i = url ? url.indexOf('/' + BUCKET + '/') : -1; return i < 0 ? '' : url.slice(i + BUCKET.length + 2); };

const KINDS = {
  logo: { title: 'Logotip (ikonka)', hint: "Kvadrat rasm. Markaz sahifasida va kartalarda belgi sifatida ko'rinadi.", ratio: 1, max: 512, prefix: 'logo_' },
  cover: { title: 'Karta rasmi', hint: "Bosh sahifa va qidiruvdagi markaz kartasida ko'rinadi. Eng yaxshisi — sinf xonasi yoki bino rasmi.", ratio: 4 / 3, max: 1200, prefix: 'cover_' }
};

export default function CenterMedia({ center, ver = 0, onChange, onMsg }) {
  const [urls, setUrls] = useState({ logo: center.logo_url || '', cover: center.cover_url || '' });
  const [photos, setPhotos] = useState([]);
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const [pick, setPick] = useState(false);
  const inputs = { logo: useRef(null), cover: useRef(null) };

  const load = useCallback(async () => {
    const [c, p] = await Promise.all([
      supabase.from('centers').select('logo_url,cover_url').eq('id', center.id).maybeSingle(),
      supabase.from('center_photos').select('id,url,thumb_url,is_cover').eq('center_id', center.id).order('sort').order('created_at')
    ]);
    if (c.data) setUrls({ logo: c.data.logo_url || '', cover: c.data.cover_url || '' });
    setPhotos(p.data || []);
  }, [center.id]);
  useEffect(() => { load(); }, [load, ver]);

  async function setMedia(kind, url) {
    const { error } = await supabase.rpc('set_center_media', { p_center: center.id, p_kind: kind, p_url: url });
    if (error) throw error;
  }
  // Galereyadagi rasm bo'lmagan eski faylni o'chiramiz (galereya rasmlariga tegmaymiz)
  async function dropOld(kind, oldUrl) {
    const p = pathOf(oldUrl);
    if (p && p.split('/').pop().startsWith(KINDS[kind].prefix)) await supabase.storage.from(BUCKET).remove([p]);
  }

  async function upload(kind, file) {
    if (!file) return;
    setErr(''); setBusy(kind);
    const k = KINDS[kind], old = urls[kind];
    try {
      const img = await cropTo(file, k.ratio, k.max, kind === 'logo' ? '#ffffff' : '');
      const path = `${center.id}/${k.prefix}${uid()}.${img.ext}`;
      const up = await supabase.storage.from(BUCKET).upload(path, img.blob, { contentType: img.type, cacheControl: '31536000', upsert: false });
      if (up.error) throw up.error;
      const url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
      try { await setMedia(kind, url); } catch (e) { await supabase.storage.from(BUCKET).remove([path]); throw e; }
      await dropOld(kind, old);
      setUrls((u) => ({ ...u, [kind]: url }));
      onMsg?.(kind === 'logo' ? 'Logotip saqlandi.' : 'Karta rasmi saqlandi.');
      onChange?.();
    } catch (e) {
      setErr(e?.message === 'read' ? "Bu rasmni o'qib bo'lmadi. JPG yoki PNG yuklang." : 'Saqlanmadi: ' + (e?.message || 'xato'));
    }
    setBusy('');
    if (inputs[kind].current) inputs[kind].current.value = '';
  }

  async function clear(kind) {
    if (!window.confirm(kind === 'logo' ? 'Logotipni olib tashlaysizmi?' : 'Karta rasmini olib tashlaysizmi?')) return;
    setErr(''); setBusy(kind);
    const old = urls[kind];
    try {
      await setMedia(kind, null);
      await dropOld(kind, old);
      setUrls((u) => ({ ...u, [kind]: '' }));
      onChange?.();
    } catch (e) { setErr('Saqlanmadi: ' + (e?.message || 'xato')); }
    setBusy('');
  }

  async function fromGallery(p) {
    setErr(''); setBusy('cover');
    const old = urls.cover;
    const { error } = await supabase.rpc('set_center_cover', { p_photo: p.id });
    if (error) setErr('Saqlanmadi: ' + error.message);
    else {
      await dropOld('cover', old);
      setPick(false);
      await load();
      onMsg?.('Karta rasmi galereyadan tanlandi.');
      onChange?.();
    }
    setBusy('');
  }

  const slot = (kind) => {
    const k = KINDS[kind], url = urls[kind], on = busy === kind;
    return (
      <div className={'cmed-slot ' + kind}>
        <div className="cmed-prev">
          {url ? <img src={url} alt="" /> : (
            <span className="cmed-ph" aria-hidden="true">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="3" /><circle cx="9" cy="10" r="1.8" /><path d="M21 16l-5-5-8 8" /></svg>
            </span>
          )}
          {on ? <span className="cmed-busy">Saqlanmoqda…</span> : null}
        </div>
        <div className="cmed-txt">
          <b>{k.title}</b>
          <small className="muted">{k.hint}</small>
          <div className="cmed-acts">
            <label className={'btn sm' + (busy ? ' dis' : '')}>
              <input ref={inputs[kind]} type="file" accept="image/*" disabled={!!busy} onChange={(e) => upload(kind, e.target.files?.[0])} />
              {url ? 'Almashtirish' : 'Rasm yuklash'}
            </label>
            {kind === 'cover' && photos.length ? <button type="button" className="btn ghost sm" onClick={() => setPick(!pick)} disabled={!!busy} aria-expanded={pick}>Galereyadan tanlash</button> : null}
            {url ? <button type="button" className="btn ghost sm cmed-del" onClick={() => clear(kind)} disabled={!!busy}>Olib tashlash</button> : null}
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="card stack cmed">
      <div>
        <b>Logotip va karta rasmi</b>
        <p className="muted small">Ikkalasi alohida tanlanadi va galereyadagi rasmlarga bog'liq emas.</p>
      </div>
      {slot('logo')}
      {slot('cover')}
      {pick ? (
        <div className="cmed-pick" role="listbox" aria-label="Galereyadan karta rasmini tanlang">
          {photos.map((p) => (
            <button key={p.id} type="button" role="option" aria-selected={p.is_cover} className={p.is_cover ? 'on' : ''} onClick={() => fromGallery(p)} disabled={!!busy}>
              <img src={p.thumb_url || p.url} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      ) : null}
      {err ? <div className="formmsg err">{err}</div> : null}
    </section>
  );
}
