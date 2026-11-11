// Saqlangan markazlar: mehmon uchun shu brauzerda (localStorage),
// kabinetga kirgan foydalanuvchi uchun bazada ham saqlanadi va barcha qurilmalarda ko'rinadi.
import { supabase } from './supabase';

const KEY = 'es_saved';
const EVT = 'es-saved';
const MAX = 60;
let uid = null; // kabinetga kirgan foydalanuvchi

export function getSaved() {
  if (typeof window === 'undefined') return [];
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string').slice(0, MAX) : [];
  } catch { return []; }
}

function write(list) {
  try { localStorage.setItem(KEY, JSON.stringify([...new Set(list)].slice(0, MAX))); } catch { /* xotira yopiq bo'lsa ham sayt ishlayveradi */ }
  try { window.dispatchEvent(new Event(EVT)); } catch { /* eski brauzerlar */ }
}

// Bazaga yozish: xato bo'lsa ham sayt ishlayveradi
function push(id, on) {
  if (!uid) return;
  const q = on
    ? supabase.from('saved_centers').upsert({ user_id: uid, center_id: id }, { onConflict: 'user_id,center_id', ignoreDuplicates: true })
    : supabase.from('saved_centers').delete().eq('user_id', uid).eq('center_id', id);
  q.then(() => {}, () => {});
}

export const isSaved = (id) => getSaved().includes(id);

export function toggleSaved(id) {
  const list = getSaved();
  const on = !list.includes(id);
  write(on ? [id, ...list] : list.filter((x) => x !== id));
  push(id, on);
  return on;
}

export function removeSaved(id) { write(getSaved().filter((x) => x !== id)); push(id, false); }

export function onSavedChange(fn) {
  const h = () => fn(getSaved());
  window.addEventListener(EVT, h);
  window.addEventListener('storage', h);
  return () => { window.removeEventListener(EVT, h); window.removeEventListener('storage', h); };
}

// Kabinetga kirilganda: qurilmadagi va bazadagi ro'yxatlar birlashtiriladi
export async function syncSaved(userId) {
  if (!userId) { uid = null; return; }
  if (uid === userId) return;
  uid = userId;
  try {
    const { data, error } = await supabase.from('saved_centers').select('center_id').eq('user_id', userId).order('created_at', { ascending: false }).limit(200);
    if (error) return;
    const remote = (data || []).map((r) => r.center_id);
    const extra = getSaved().filter((x) => !remote.includes(x));
    for (const id of extra) {
      await supabase.from('saved_centers').upsert({ user_id: userId, center_id: id }, { onConflict: 'user_id,center_id', ignoreDuplicates: true });
    }
    write([...extra, ...remote]);
  } catch { /* internet uzilsa keyingi safar birlashtiriladi */ }
}

// Kabinetdan chiqilganda qurilmadagi ro'yxat tozalanadi (bazada qoladi)
export function clearSaved() { uid = null; write([]); }
