// Foydalanuvchi qaysi kanaldan kelganini eslab qoladi (birinchi tashrif, 30 kun).
// Ariza yuborilganda "manba" sifatida saqlanadi: masalan, telegram:kanal_nomi yoki google.
const KEY = 'es-src';
const DAYS = 30;
const clean = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9_.:-]/g, '').slice(0, 40);

export function captureSource() {
  try {
    const q = new URLSearchParams(window.location.search);
    let src = '';
    const utm = clean(q.get('utm_source'));
    if (utm) src = [utm, clean(q.get('utm_medium')), clean(q.get('utm_campaign'))].filter(Boolean).join(':');
    else if (q.get('ref')) src = 'ref:' + clean(q.get('ref'));
    else if (document.referrer) {
      const h = new URL(document.referrer).hostname.replace(/^www\./, '');
      if (h && h !== window.location.hostname) {
        src = /google\./.test(h) ? 'google' : /yandex\./.test(h) ? 'yandex' : /(^|\.)t\.me$|telegram/.test(h) ? 'telegram'
          : /instagram/.test(h) ? 'instagram' : /facebook|fb\./.test(h) ? 'facebook' : clean(h);
      }
    }
    if (!src) return;
    const old = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (old && old.t && Date.now() - old.t < DAYS * 864e5) return; // birinchi manba saqlanadi
    localStorage.setItem(KEY, JSON.stringify({ s: src.slice(0, 60), t: Date.now() }));
  } catch {}
}

export function getSource() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (v && v.s && Date.now() - v.t < DAYS * 864e5) return v.s;
  } catch {}
  return null;
}
