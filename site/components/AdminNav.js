'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { ADMIN } from './AdminGate';

// Faqat admin tizimga kirgan bo'lsa ko'rinadigan bo'limlar paneli
export default function AdminNav() {
  const path = usePathname();
  const [ok, setOk] = useState(false);
  const [cnt, setCnt] = useState({});
  useEffect(() => {
    let live = true;
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { if (live) setOk(false); return; }
      const { data } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
      const isAdmin = data?.role === 'admin';
      if (live) setOk(isAdmin);
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
  const items = [
    [ADMIN, 'Boshqaruv paneli'],
    [ADMIN + '/arizalar', 'Arizalar', cnt.applications_new],
    [ADMIN + '/sharhlar', 'Sharhlar', cnt.reviews_pending],
    [ADMIN + '/tavsiya', 'Belgilar va kontaktlar'],
    [ADMIN + '/bot', 'Telegram bot'],
    [ADMIN + '/statistika', 'Statistika']
  ];
  return (
    <div className="anav">
      <div className="wrap anav-in">
        <span className="anav-l">Admin</span>
        {items.map(([h, l, n]) => <Link key={h} href={h} className={path === h ? 'on' : ''}>{l}{n ? <span className="cnt">{n}</span> : null}</Link>)}
      </div>
    </div>
  );
}
