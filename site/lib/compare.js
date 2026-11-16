// Taqqoslash ro'yxati: brauzerda saqlanadi (ko'pi bilan 3 ta markaz)
const KEY = 'es-compare';
const EV = 'es-compare';
export const MAX_COMPARE = 3;

export function getCompare() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string').slice(0, MAX_COMPARE) : [];
  } catch { return []; }
}

function setCompare(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch {}
  try { window.dispatchEvent(new CustomEvent(EV, { detail: list })); } catch {}
}

// Qaytaradi: 'added' | 'removed' | 'full'
export function toggleCompare(id) {
  const list = getCompare();
  if (list.includes(id)) { setCompare(list.filter((x) => x !== id)); return 'removed'; }
  if (list.length >= MAX_COMPARE) return 'full';
  setCompare([...list, id]);
  return 'added';
}

export function clearCompare() { setCompare([]); }
export function removeCompare(id) { setCompare(getCompare().filter((x) => x !== id)); }

export function onCompareChange(cb) {
  const h = () => cb(getCompare());
  const s = (e) => { if (e.key === KEY) h(); };
  window.addEventListener(EV, h);
  window.addEventListener('storage', s);
  return () => { window.removeEventListener(EV, h); window.removeEventListener('storage', s); };
}
