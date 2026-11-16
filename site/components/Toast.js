'use client';
import { useEffect, useState } from 'react';

// Kichik bildirishnoma (pastda shisha ko'rinishida chiqadi)
export function toast(text) {
  try { window.dispatchEvent(new CustomEvent('es-toast', { detail: String(text) })); } catch {}
}

export default function Toast() {
  const [msg, setMsg] = useState(null);
  useEffect(() => {
    let t;
    const h = (e) => { clearTimeout(t); setMsg({ text: e.detail, k: Date.now() }); t = setTimeout(() => setMsg(null), 2600); };
    window.addEventListener('es-toast', h);
    return () => { window.removeEventListener('es-toast', h); clearTimeout(t); };
  }, []);
  return (
    <div className="toastw" aria-live="polite" role="status">
      {msg ? <div key={msg.k} className="toast glass">{msg.text}</div> : null}
    </div>
  );
}
