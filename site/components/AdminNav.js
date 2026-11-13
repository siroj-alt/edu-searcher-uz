'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { ADMIN } from './AdminGate';
import LogoMark from './LogoMark';
import ThemeToggle from './ThemeToggle';

const ic = (d) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>;
const ICONS = {
  home: ic(<><rect x="3" y="3" width="7" height="8" rx="2" /><rect x="14" y="3" width="7" height="5" rx="2" /><rect x="14" y="12" width="7" height="9" rx="2" /><rect x="3" y="15" width="7" height="6" rx="2" /></>),
  apps: ic(<><path d="M8 4h8l1 3h3v13H4V7h3z" /><path d="M9 13l2 2 4-4" /></>),
  reviews: ic(<path d="M12 3l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.8z" />),
  badges: ic(<><path d="M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6z" /><path d="M9 12l2.2 2.2L15.5 10" /></>),
  bot: ic(<><path d="M21 4L3 11l6 2.5L11.5 20l3-5 5.5 4z" /><path d="M9 13.5l6-4.5" /></>),
  stats: ic(<><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>)
};

// Admin bo'limlari: chap menyu (telefonda tepada gorizontal)
export default function AdminNav() {
  const path = usePathname();
  const [ok, setOk] = useState(false);
  const [email, setEmail] = useState('');
  const [cnt, setCnt] = useState({});
  useEffect(() => {
    let live = true;
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { if (live) setOk(false); return; }
      const { data } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
      const isAdmin = data?.role === 'admin';
      if (live) { setOk(isAdmin); setEmail(session.user.email || ''); }
      if (isAdmin) {
        const { data: c } = await supabase.rpc('admin_counts');
        if (live && c) setCnt(c);
      }
    };
    check();
    const { data: sub } = supabase.auth.onAuthStateChange(() => { setTimeout(check, 0); });
    const onUpd = () => check();
    window.addEventListener('es-admin-counts', onUpd);
    return () => { live = false; sub?.subscription?.unsubscribe(); window.removeEventListener('es-admin-counts', onUpd); };
  }, []);
  if (!ok) return null;

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = ADMIN;
  }

  const items = [
    [ADMIN, 'Asosiy panel', "Markazlar, foydalanuvchilar, adminlar", 'home'],
    [ADMIN + '/arizalar', 'Arizalar', "O'qishga yuborilgan arizalar", 'apps', cnt.applications_new],
    [ADMIN + '/sharhlar', 'Sharhlar', 'Tasdiqlashni kutayotgan sharhlar', 'reviews', cnt.reviews_pending],
    [ADMIN + '/tavsiya', 'Belgilar va kontaktlar', 'Tavsiya, tasdiq belgisi, aloqa', 'badges'],
    [ADMIN + '/bot', 'Telegram bot', 'Bot foydalanuvchilari va arizalari', 'bot'],
    [ADMIN + '/statistika', 'Statistika', "Tashriflar va qiziqishlar", 'stats']
  ];
  return (
    <aside className="adm-side">
      <div className="adm-top">
        <Link href={ADMIN} className="adm-brand">
          <LogoMark size={36} id="lm-adm" />
          <span><b>EduSearcher</b><small>Boshqaruv paneli</small></span>
        </Link>
        <div className="adm-mini"><ThemeToggle /></div>
      </div>
      <nav className="adm-nav" aria-label="Admin bo'limlari">
        {items.map(([h, l, d, i, n]) => {
          const on = path === h;
          return (
            <Link key={h} href={h} className={on ? 'on' : ''} aria-current={on ? 'page' : undefined}>
              <i>{ICONS[i]}</i>
              <span><b>{l}</b><small>{d}</small></span>
              {n ? <em title="Yangi">{n}</em> : null}
            </Link>
          );
        })}
      </nav>
      <div className="adm-foot">
        {email ? <div className="adm-me" title={email}><span>{email.slice(0, 1).toUpperCase()}</span><small>{email}</small></div> : null}
        <div className="adm-acts">
          <ThemeToggle />
          <Link href="/" className="adm-btn" target="_blank" rel="noopener noreferrer">Saytni ochish</Link>
          <button type="button" className="adm-btn out" onClick={logout}>Chiqish</button>
        </div>
      </div>
    </aside>
  );
}
