'use client';

// Yorug' / qorong'u rejim tugmasi. Tanlov localStorage'da saqlanadi; tanlanmagan bo'lsa telefon/kompyuter sozlamasiga mos tushadi.
import { THEME_KEY as KEY } from '../lib/theme';
const COLORS = { light: '#F5FAF7', dark: '#07130E' };

export function applyTheme(t) {
  const root = document.documentElement;
  root.dataset.theme = t;
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', COLORS[t]));
  try { window.dispatchEvent(new CustomEvent('es-theme', { detail: t })); } catch {}
}

export default function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.classList.add('theme-anim');
    applyTheme(next);
    try { localStorage.setItem(KEY, next); } catch {}
    setTimeout(() => root.classList.remove('theme-anim'), 400);
  }
  return (
    <button type="button" className="thm" onClick={toggle} aria-label="Yorug' yoki qorong'u rejimni almashtirish" title="Rejimni almashtirish">
      <svg className="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /></svg>
      <svg className="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
    </button>
  );
}
