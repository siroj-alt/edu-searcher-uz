'use client';
import { useState } from 'react';

const SITE = 'https://edusearcher.uz';

// Markaz o'quvchilaridan sharh yig'ish: havola va QR-kod (qabulxonaga yoki sinfga ilib qo'yish uchun)
export default function ReviewQr({ center }) {
  const [copied, setCopied] = useState(false);
  const link = `${SITE}/centers/${center.id}?utm_source=qr&utm_medium=markaz#sharhlar`;
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=480x480&margin=16&format=png&data=${encodeURIComponent(link)}`;
  async function copy() {
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  }
  function print() {
    const w = window.open('', '_blank');
    if (!w) return;
    const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    w.document.write(`<!doctype html><html lang="uz"><head><meta charset="utf-8"><title>${esc(center.name)} — sharh qoldiring</title>
<style>body{font-family:system-ui,sans-serif;text-align:center;padding:40px;color:#0f2a22}h1{font-size:34px;margin:0 0 8px}p{font-size:20px;margin:0 0 24px}img{width:320px;height:320px}small{display:block;margin-top:18px;font-size:15px;color:#4a6158}</style></head>
<body><h1>${esc(center.name)}</h1><p>Biz haqimizda fikringizni qoldiring — bu boshqa o'quvchilarga tanlashda yordam beradi.</p>
<img src="${qr}" alt="QR-kod" onload="setTimeout(function(){window.print()},300)"><small>Telefon kamerasi bilan QR-kodni skanerlang · edusearcher.uz</small></body></html>`);
    w.document.close();
  }
  return (
    <div className="card stack revqr">
      <b>O'quvchilardan sharh yig'ish</b>
      <p className="muted small">Sharhlar qidiruvda markazingizni yuqoriroq ko'rsatadi va ota-onalar ishonchini oshiradi. QR-kodni qabulxonaga ilib qo'ying yoki havolani o'quvchilar guruhiga yuboring. Sharhni faqat kabinetga kirgan foydalanuvchi qoldira oladi.</p>
      <div className="revqr-b">
        <img src={qr} alt="Sharh qoldirish uchun QR-kod" width="140" height="140" loading="lazy" />
        <div className="stack" style={{ gap: 8 }}>
          <code className="revqr-l">{link.replace('https://', '')}</code>
          <div className="row" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="btn sm" onClick={copy}>{copied ? 'Nusxalandi' : 'Havolani nusxalash'}</button>
            <button type="button" className="btn ghost sm" onClick={print}>Plakatni chop etish</button>
          </div>
        </div>
      </div>
    </div>
  );
}
