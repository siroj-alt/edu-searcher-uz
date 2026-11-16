'use client';
import { useEffect, useState } from 'react';

const PHONE = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinejoin="round" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>;
const TG = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 3L10 14M21 3l-7 18-4-8-8-4z" /></svg>;

// Markaz sahifasida pastda doim ko'rinadigan shisha panel: qo'ng'iroq, Telegram, ariza.
// Ariza formasi ekranga chiqqanda panel yashirinadi.
export default function StickyCta({ phone = '', telegram = '', name = '' }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    let raf = 0;
    const check = () => {
      raf = 0;
      const form = document.getElementById('ariza-forma');
      const head = document.getElementById('center-actions');
      const vh = window.innerHeight;
      const headIn = head ? head.getBoundingClientRect().bottom > 0 : false;
      const fr = form ? form.getBoundingClientRect() : null;
      const formIn = fr ? fr.top < vh - 80 && fr.bottom > 0 : false;
      setShow(!headIn && !formIn);
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(check); };
    check();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on); cancelAnimationFrame(raf); };
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle('has-cta', show);
    return () => document.documentElement.classList.remove('has-cta');
  }, [show]);
  const tg = telegram ? (/^https?:/i.test(telegram) ? telegram : 'https://t.me/' + telegram.replace(/^@/, '')) : '';
  return (
    <div className={'scta glass' + (show ? ' on' : '')} aria-hidden={!show}>
      {phone ? <a className="scta-ic" href={'tel:' + phone.replace(/[^\d+]/g, '')} aria-label={`${name}: qo'ng'iroq qilish`} tabIndex={show ? 0 : -1}>{PHONE}</a> : null}
      {tg ? <a className="scta-ic tg" href={tg} target="_blank" rel="noopener noreferrer" aria-label={`${name}: Telegram`} tabIndex={show ? 0 : -1}>{TG}</a> : null}
      <a className="scta-go" href="#ariza" tabIndex={show ? 0 : -1}>Ariza qoldirish</a>
    </div>
  );
}
