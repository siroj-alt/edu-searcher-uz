'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

// Markaz sahifasidagi rasmlar: asosiy rasm katta, qolganlari yonida; bosilganda to'liq ekranda ko'rish
export default function CenterGallery({ photos = [], name = '' }) {
  const list = [...photos].sort((a, b) => (b.is_cover === true) - (a.is_cover === true) || (a.sort ?? 0) - (b.sort ?? 0));
  const [open, setOpen] = useState(-1);
  const touch = useRef(null);
  const n = list.length;
  const go = useCallback((d) => setOpen((i) => (i < 0 ? i : (i + d + n) % n)), [n]);

  useEffect(() => {
    if (open < 0) return;
    const k = (e) => { if (e.key === 'Escape') setOpen(-1); if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); };
    document.addEventListener('keydown', k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', k); document.body.style.overflow = prev; };
  }, [open, go]);

  if (!n) return null;
  const side = list.slice(1, 5);
  return (
    <>
      <section className={'cgal' + (n === 1 ? ' one' : '')} aria-label={`${name} rasmlari`}>
        <button type="button" className="cgal-main" onClick={() => setOpen(0)} aria-label="Rasmni kattalashtirish">
          <img src={list[0].url} alt={name} fetchPriority="high" decoding="async" />
        </button>
        {side.length ? (
          <div className="cgal-side">
            {side.map((p, i) => (
              <button type="button" key={p.id} className="cgal-th" onClick={() => setOpen(i + 1)} aria-label={`${i + 2}-rasm`}>
                <img src={p.thumb_url || p.url} alt="" loading="lazy" decoding="async" />
                {i === side.length - 1 && n > 5 ? <span className="cgal-more">+{n - 5}</span> : null}
              </button>
            ))}
          </div>
        ) : null}
        {n > 1 ? <span className="cgal-count">{n} ta rasm</span> : null}
      </section>
      {open >= 0 ? (
        <div className="cbox" role="dialog" aria-modal="true" aria-label={`${name}: ${open + 1} / ${n}`} onClick={(e) => { if (e.target === e.currentTarget) setOpen(-1); }}
          onTouchStart={(e) => { touch.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => { if (touch.current == null) return; const dx = e.changedTouches[0].clientX - touch.current; touch.current = null; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); }}>
          <img src={list[open].url} alt={`${name}: ${open + 1}-rasm`} />
          <button type="button" className="cbox-x" onClick={() => setOpen(-1)} aria-label="Yopish">×</button>
          {n > 1 ? (
            <>
              <button type="button" className="cbox-n prev" onClick={() => go(-1)} aria-label="Oldingi rasm">‹</button>
              <button type="button" className="cbox-n next" onClick={() => go(1)} aria-label="Keyingi rasm">›</button>
              <span className="cbox-c">{open + 1} / {n}</span>
            </>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
