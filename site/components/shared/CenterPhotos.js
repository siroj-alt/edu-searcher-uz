'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';

// Markaz rasmlari: bir nechta rasm yuklash, asosiy rasmni tanlash, tartibini o'zgartirish, o'chirish.
// Asosiy rasm markaz kartalarida, kurslar ro'yxatida va markaz sahifasining boshida ko'rinadi.
const BUCKET = 'center-photos';
const MAX_PHOTOS = 20;
const FULL = 1600;
const THUMB = 720;

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

// Rasmni kichraytirib WebP qiladi: sahifalar tez ochilishi uchun
async function shrink(bmp, max, quality) {
  const w = bmp.width || bmp.naturalWidth, h = bmp.height || bmp.naturalHeight;
  const k = Math.min(1, max / Math.max(w, h));
  const cw = Math.round(w * k), ch = Math.round(h * k);
  const c = document.createElement('canvas');
  c.width = cw; c.height = ch;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bmp, 0, 0, cw, ch);
  let blob = await new Promise((r) => c.toBlob(r, 'image/webp', quality));
  let type = 'image/webp', ext = 'webp';
  if (!blob || blob.type !== 'image/webp') { blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', quality)); type = 'image/jpeg'; ext = 'jpg'; }
  return { blob, type, ext };
}

export default function CenterPhotos({ centerId, onMsg }) {
  const [list, setList] = useState(null);
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const input = useRef(null);
  const say = (m) => { onMsg?.(m); };

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('center_photos').select('id,path,url,thumb_path,thumb_url,is_cover,sort,created_at').eq('center_id', centerId).order('sort').order('created_at');
    if (error) { setErr("Rasmlarni yuklab bo'lmadi: " + error.message); setList([]); return; }
    setList(data || []);
  }, [centerId]);

  useEffect(() => { load(); }, [load]);

  async function upload(files) {
    setErr('');
    const arr = [...files].filter((f) => /^image\//.test(f.type) || /\.(jpe?g|png|webp|heic|heif)$/i.test(f.name));
    if (!arr.length) return;
    const room = MAX_PHOTOS - (list?.length || 0);
    if (room <= 0) return setErr(`Ko'pi bilan ${MAX_PHOTOS} ta rasm yuklash mumkin.`);
    const take = arr.slice(0, room);
    let sort = (list || []).reduce((m, p) => Math.max(m, p.sort), -1) + 1;
    let ok = 0;
    const fails = [];
    for (let i = 0; i < take.length; i++) {
      const f = take[i];
      setBusy(`Yuklanmoqda: ${i + 1} / ${take.length}`);
      try {
        const bmp = await loadBitmap(f);
        const full = await shrink(bmp, FULL, 0.84);
        const thumb = await shrink(bmp, THUMB, 0.8);
        if (bmp.close) bmp.close();
        const id = uid();
        const path = `${centerId}/${id}.${full.ext}`;
        const tpath = `${centerId}/${id}_t.${thumb.ext}`;
        const up1 = await supabase.storage.from(BUCKET).upload(path, full.blob, { contentType: full.type, cacheControl: '31536000', upsert: false });
        if (up1.error) throw up1.error;
        const up2 = await supabase.storage.from(BUCKET).upload(tpath, thumb.blob, { contentType: thumb.type, cacheControl: '31536000', upsert: false });
        if (up2.error) { await supabase.storage.from(BUCKET).remove([path]); throw up2.error; }
        const url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
        const turl = supabase.storage.from(BUCKET).getPublicUrl(tpath).data.publicUrl;
        const ins = await supabase.from('center_photos').insert({ center_id: centerId, path, url, thumb_path: tpath, thumb_url: turl, sort: sort++ });
        if (ins.error) { await supabase.storage.from(BUCKET).remove([path, tpath]); throw ins.error; }
        ok++;
      } catch (e) {
        fails.push(f.name + (e?.message === 'read' ? " (bu formatni o'qib bo'lmadi, JPG yoki PNG yuklang)" : ''));
      }
    }
    setBusy('');
    if (input.current) input.current.value = '';
    await load();
    if (ok) say(`${ok} ta rasm yuklandi.`);
    if (fails.length) setErr("Yuklanmadi: " + fails.join(', '));
    if (arr.length > room) setErr((e) => (e ? e + ' ' : '') + `Faqat ${room} tasi qabul qilindi (chegara ${MAX_PHOTOS} ta).`);
  }

  async function makeCover(p) {
    setBusy('Saqlanmoqda...');
    const { error } = await supabase.rpc('set_center_cover', { p_photo: p.id });
    setBusy('');
    if (error) return setErr(error.message);
    await load();
    say('Asosiy rasm tanlandi. U markaz kartalarida va kurslar ro\'yxatida ko\'rinadi.');
  }

  async function remove(p) {
    if (!window.confirm("Bu rasmni o'chirasizmi?")) return;
    setBusy("O'chirilmoqda...");
    const { error } = await supabase.from('center_photos').delete().eq('id', p.id);
    if (!error) await supabase.storage.from(BUCKET).remove([p.path, p.thumb_path].filter(Boolean));
    setBusy('');
    if (error) return setErr(error.message);
    await load();
    say("Rasm o'chirildi.");
  }

  async function move(i, d) {
    const j = i + d;
    if (!list || j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    setList(next.map((p, k) => ({ ...p, sort: k })));
    const res = await Promise.all(next.map((p, k) => (p.sort !== k ? supabase.from('center_photos').update({ sort: k }).eq('id', p.id) : null)).filter(Boolean));
    if (res.some((r) => r.error)) { setErr('Tartib saqlanmadi.'); load(); }
  }

  function onDrop(e) {
    e.preventDefault();
    if (busy) return;
    if (e.dataTransfer?.files?.length) upload(e.dataTransfer.files);
  }

  return (
    <div className="card stack cphotos" onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
      <div className="cph-head">
        <div>
          <b>Markaz rasmlari</b>
          <p className="muted small">Bir nechta rasm yuklang. <b>Asosiy</b> deb belgilangan rasm markaz kartasida, kurslar ro'yxatida va markaz sahifasining boshida ko'rinadi.</p>
        </div>
        <label className={'btn sm cph-add' + (busy ? ' dis' : '')}>
          <input ref={input} type="file" accept="image/*" multiple disabled={!!busy} onChange={(e) => upload(e.target.files)} />
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
          Rasm qo'shish
        </label>
      </div>
      {busy ? <div className="formmsg ok">{busy}</div> : null}
      {err ? <div className="formmsg err">{err}</div> : null}
      {list === null ? <p className="muted small">Yuklanmoqda...</p> : list.length === 0 ? (
        <button type="button" className="cph-empty" onClick={() => input.current?.click()} disabled={!!busy}>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3" /><circle cx="9" cy="10" r="1.8" /><path d="M21 16l-5-5-8 8" /></svg>
          <span>Hali rasm yo'q. Bosing yoki rasmlarni shu yerga tashlang.</span>
          <small>JPG, PNG yoki WebP. Rasmlar avtomatik kichraytiriladi.</small>
        </button>
      ) : (
        <div className="cph-grid">
          {list.map((p, i) => (
            <figure key={p.id} className={'cph' + (p.is_cover ? ' cover' : '')}>
              <img src={p.thumb_url || p.url} alt="" loading="lazy" />
              {p.is_cover ? <span className="cph-tag">Asosiy rasm</span> : null}
              <figcaption>
                {!p.is_cover ? <button type="button" className="cph-b main" onClick={() => makeCover(p)} disabled={!!busy}>Asosiy qilish</button> : <span className="cph-note">Kartalarda ko'rinadi</span>}
                <span className="cph-tools">
                  <button type="button" className="cph-i" onClick={() => move(i, -1)} disabled={!!busy || i === 0} aria-label="Chapga surish">‹</button>
                  <button type="button" className="cph-i" onClick={() => move(i, 1)} disabled={!!busy || i === list.length - 1} aria-label="O'ngga surish">›</button>
                  <button type="button" className="cph-i del" onClick={() => remove(p)} disabled={!!busy} aria-label="O'chirish">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></svg>
                  </button>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
