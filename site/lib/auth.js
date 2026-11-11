// Kabinet: login + parol. Login ichkarida "<login>@id.edusearcher.uz" ko'rinishidagi email sifatida saqlanadi,
// shuning uchun foydalanuvchidan email so'ralmaydi. Adminlar o'z emaili bilan kiradi.
import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { syncSaved, clearSaved } from './saved';

export const LOGIN_DOMAIN = '@id.edusearcher.uz';
export const LOGIN_RE = /^[a-z0-9][a-z0-9_.]{2,29}$/;
export const PHONE_RE = /^\+?[0-9][0-9 ()-]{6,19}$/;

export const normLogin = (v) => String(v || '').trim().toLowerCase().replace(/[\s+()-]/g, '');
export const loginToEmail = (v) => {
  const t = String(v || '').trim();
  return t.includes('@') ? t.toLowerCase() : normLogin(t) + LOGIN_DOMAIN;
};
export const validPhone = (p) => PHONE_RE.test(String(p || '').trim()) && String(p).replace(/\D/g, '').length >= 9;

// Baza funksiyasi qaytargan tushunarli xabar yoki umumiy matn
export const rpcMsg = (error, fallback = "Amal bajarilmadi. Birozdan so'ng qayta urinib ko'ring.") =>
  (error && (error.code === 'P0001' || error.code === '42501') && error.message ? error.message : fallback);

export const homeFor = (me) => (me?.role === 'center_owner' ? '/markaz-kabineti' : '/kabinet');

export async function getMe() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  const { data } = await supabase.from('profiles').select('role,login,full_name,phone,email').eq('id', session.user.id).maybeSingle();
  return {
    id: session.user.id,
    role: data?.role || 'user',
    login: data?.login || null,
    full_name: data?.full_name || '',
    phone: data?.phone || '',
    email: data?.email || session.user.email || ''
  };
}

// Barcha komponentlar uchun bitta umumiy holat: undefined = yuklanmoqda, null = mehmon
let state;
let started = false;
const subs = new Set();

export async function refreshMe() {
  try { state = await getMe(); } catch { state = null; }
  subs.forEach((f) => f(state));
  syncSaved(state?.id || null);
  return state;
}

function start() {
  if (started || typeof window === 'undefined') return;
  started = true;
  refreshMe();
  supabase.auth.onAuthStateChange((ev) => {
    if (ev === 'SIGNED_IN' || ev === 'SIGNED_OUT' || ev === 'USER_UPDATED') setTimeout(refreshMe, 0);
  });
}

export function useMe() {
  const [me, setMe] = useState(undefined); // server va brauzerda birinchi chizish bir xil bo'lishi uchun
  useEffect(() => {
    subs.add(setMe);
    start();
    setMe(state);
    return () => { subs.delete(setMe); };
  }, []);
  return me;
}

// Xato matnini qaytaradi; muvaffaqiyatli bo'lsa bo'sh satr
export async function signIn(login, password) {
  const { error } = await supabase.auth.signInWithPassword({ email: loginToEmail(login), password });
  if (error) return /invalid/i.test(error.message || '') ? "Login yoki parol noto'g'ri." : "Kirib bo'lmadi. Internetni tekshirib, qayta urinib ko'ring.";
  return '';
}

export async function signUp({ login, password, full_name, phone }) {
  const { error } = await supabase.rpc('register_user', { p_login: login, p_password: password, p_full_name: full_name, p_phone: phone || null });
  if (error) return rpcMsg(error, "Ro'yxatdan o'tib bo'lmadi. Birozdan so'ng qayta urinib ko'ring.");
  return signIn(login, password);
}

export async function signOut() {
  clearSaved();
  await supabase.auth.signOut();
  await refreshMe();
}

export const fmtSum = (n) => Number(n || 0).toLocaleString('ru-RU') + " so'm";
export const fmtDay = (d) => {
  const t = d ? new Date(d) : null;
  if (!t || isNaN(t)) return '';
  const p = (n) => String(n).padStart(2, '0');
  return `${p(t.getDate())}.${p(t.getMonth() + 1)}.${t.getFullYear()}`;
};
const MONTHS = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
// "2026-11-01" -> "Noyabr 2026"
export const fmtMonth = (iso) => { const [y, m] = String(iso).split('-'); return `${MONTHS[Number(m) - 1] || ''} ${y}`; };
// Boshlangan oydan keyingi oygacha bo'lgan oylar ro'yxati ("YYYY-MM-01"), yangilari oldinda
export function monthsFrom(startIso, extra = 1) {
  const now = new Date();
  const s = new Date(String(startIso).slice(0, 10) + 'T00:00:00');
  if (isNaN(s)) return [];
  const out = [];
  const start = s.getFullYear() * 12 + s.getMonth();
  const end = Math.max(now.getFullYear() * 12 + now.getMonth() + extra, start);
  for (let k = Math.max(start, end - 35); k <= end; k++) out.push(`${Math.floor(k / 12)}-${String((k % 12) + 1).padStart(2, '0')}-01`);
  return out.reverse();
}
export const thisMonth = () => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-01`; };

export const APP_STATUS = { new: 'Yuborildi', contacted: "Bog'lanildi", accepted: 'Qabul qilindi', rejected: 'Rad etildi', cancelled: 'Bekor qilingan' };
export const PAY_METHOD = { payme: 'Payme', click: 'Click', card: 'Kartaga o\'tkazma', cash: 'Naqd', other: 'Boshqa' };
export const PAY_STATUS = { pending: 'Tekshirilmoqda', paid: "To'langan", rejected: 'Rad etilgan' };
