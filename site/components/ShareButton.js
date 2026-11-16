'use client';
import { toast } from './Toast';

// Ulashish: telefonda tizim oynasi (Telegram, Instagram...), kompyuterda havolani nusxalash
export default function ShareButton({ title = '', text = '', className = 'btn ghost', label = true }) {
  const share = async () => {
    const url = window.location.href.split('#')[0];
    if (navigator.share) {
      try { await navigator.share({ title, text, url }); return; } catch (e) { if (e && e.name === 'AbortError') return; }
    }
    try { await navigator.clipboard.writeText(url); toast('Havola nusxalandi'); }
    catch { window.open('https://t.me/share/url?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(title), '_blank', 'noopener'); }
  };
  return (
    <button type="button" className={className} onClick={share} aria-label="Ulashish" title="Ulashish">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12M8 7l4-4 4 4M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" /></svg>
      {label ? 'Ulashish' : null}
    </button>
  );
}
