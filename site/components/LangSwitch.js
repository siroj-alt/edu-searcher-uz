'use client';
import { useEffect, useState } from 'react';
import { LANG_KEY } from '../lib/i18n';

// O'zbekcha / Ruscha almashtirgich (sarlavhada)
export default function LangSwitch() {
  const [lang, setLang] = useState('uz');
  useEffect(() => { try { setLang(localStorage.getItem(LANG_KEY) === 'ru' ? 'ru' : 'uz'); } catch {} }, []);
  const pick = (l) => {
    if (l === lang) return;
    try { localStorage.setItem(LANG_KEY, l); document.cookie = `${LANG_KEY}=${l};path=/;max-age=31536000;samesite=lax`; } catch {}
    if (l === 'uz') { window.location.reload(); return; }
    setLang(l);
    try { window.dispatchEvent(new CustomEvent('es-lang', { detail: l })); } catch {}
  };
  return (
    <div className="lang" role="group" aria-label="Til / Язык" data-notr>
      <button type="button" className={lang === 'uz' ? 'on' : ''} aria-pressed={lang === 'uz'} onClick={() => pick('uz')} lang="uz">UZ</button>
      <button type="button" className={lang === 'ru' ? 'on' : ''} aria-pressed={lang === 'ru'} onClick={() => pick('ru')} lang="ru">RU</button>
    </div>
  );
}
