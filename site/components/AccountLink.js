'use client';
import Link from 'next/link';
import { useMe, homeFor } from '../lib/auth';

export const UserIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20.5c1.2-3.6 4.3-5.5 8-5.5s6.8 1.9 8 5.5" />
  </svg>
);

// Sarlavhadagi "Kirish" / kabinet havolasi
export default function AccountLink() {
  const me = useMe();
  if (!me) return <Link className="acct" href="/kirish"><UserIcon />Kirish</Link>;
  const name = (me.full_name || me.login || 'Kabinet').trim().split(/\s+/)[0].slice(0, 14);
  return <Link className="acct on" href={homeFor(me)} title="Shaxsiy kabinet"><UserIcon />{name}</Link>;
}
