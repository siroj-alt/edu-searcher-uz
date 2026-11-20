'use client';
import { useEffect, useState } from 'react';
import CompareToggle from './CompareToggle';


// Markaz sahifasida pastda doim ko'rinadigan shisha panel: qo'ng'iroq, Telegram, ariza.
// Ariza formasi ekranga chiqqanda panel yashirinadi.
export default function StickyCta({ id = '', phone = '', telegram = '', name = '' }) {
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
  return (
    <div className={'scta glass' + (show ? ' on' : '')} aria-hidden={!show}>
      {id ? <CompareToggle id={id} variant="chip scta-cmp" /> : null}
      <a className="scta-go" href="#ariza" tabIndex={show ? 0 : -1}>Ariza berish</a>
    </div>
  );
}
