'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// Yengil jonlantirish: pastdan paydo bo'lish, raqamlarni sanash, o'qish chizig'i.
// Og'ir 3D egilish effektlari telefonda sekinlashtirgani uchun olib tashlandi.
const REVEAL = '.hsec, .hcat, .tilew, .rgn, .hstep, .hcta, .sec, .cat, .step, .rcard, .layout2 > .card, .bwrap, .grid2 > .card';

function countUp(el) {
  if (el.dataset.counted) return;
  el.dataset.counted = '1';
  const to = Number(el.dataset.count) || 0;
  if (to < 10) return;
  const t0 = performance.now(), ms = 1100;
  const step = (t) => {
    const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 4);
    el.textContent = Math.round(to * e).toLocaleString('ru-RU');
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export default function Motion() {
  const path = usePathname() || '/';

  useEffect(() => {
    if (path.startsWith('/boshqaruv')) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const counters = [...document.querySelectorAll('[data-count]')];
    if (reduce || !('IntersectionObserver' in window)) { counters.forEach((c) => { c.dataset.counted = '1'; }); return; }
    const io = new IntersectionObserver((ents) => {
      for (const e of ents) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('in');
        e.target.querySelectorAll?.('[data-count]').forEach(countUp);
        if (e.target.matches('[data-count]')) countUp(e.target);
        io.unobserve(e.target);
      }
    }, { rootMargin: '0px 0px -5% 0px', threshold: 0.05 });
    let i = 0;
    const vh = window.innerHeight;
    for (const el of document.querySelectorAll(REVEAL)) {
      if (el.dataset.rv || el.closest('.leaf')) continue;
      el.dataset.rv = '1';
      if (el.getBoundingClientRect().top < vh * 0.95) continue; // ko'rinib turganini yashirmaymiz
      el.style.setProperty('--rvd', (i++ % 4) * 60 + 'ms');
      el.classList.add('rv');
      io.observe(el);
    }
    for (const c of counters) {
      if (c.getBoundingClientRect().top < vh) countUp(c); else io.observe(c);
    }
    return () => io.disconnect();
  }, [path]);

  useEffect(() => {
    // o'qish chizig'i: faqat transform o'zgaradi (sahifa qayta hisoblanmaydi)
    let raf = 0;
    const root = document.documentElement;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const h = root.scrollHeight - window.innerHeight;
        root.style.setProperty('--sp', h > 0 ? (window.scrollY / h).toFixed(4) : '0');
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, []);

  return null;
}
