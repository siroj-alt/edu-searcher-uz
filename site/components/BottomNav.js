'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SavedCount from './SavedCount';
import { useMe, homeFor } from '../lib/auth';

const I = {
  home: <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.6-3.6" /></>,
  map: <><path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z" /><path d="M9 4v14M15 6v14" /></>,
  heart: <path d="M12 20.5s-7.5-4.6-9.3-9.4C1.5 7.8 3.6 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.4 0 5.5 3.3 4.3 6.6-1.8 4.8-9.3 9.4-9.3 9.4z" />,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 20.5c1.2-3.6 4.3-5.5 8-5.5s6.8 1.9 8 5.5" /></>
};

const ITEMS = [
  ['/', 'Bosh sahifa', 'home', (p) => p === '/'],
  ['/search', 'Markazlar', 'search', (p) => p.startsWith('/search') || p.startsWith('/centers') || p.startsWith('/markazlar')],
  ['/xarita', 'Xarita', 'map', (p) => p.startsWith('/xarita')],
  ['/saqlangan', 'Saqlangan', 'heart', (p) => p.startsWith('/saqlangan')],
  ['/kabinet', 'Kabinet', 'user', (p) => p.startsWith('/kabinet') || p.startsWith('/kirish') || p.startsWith('/markaz-kabineti')]
];

export default function BottomNav() {
  const path = usePathname() || '/';
  const me = useMe();
  return (
    <nav className="bnav">
      {ITEMS.map(([href, label, ic, act]) => (
        <Link key={href} href={ic === 'user' ? (me ? homeFor(me) : '/kirish') : href} className={act(path) ? 'on' : ''}>
          <i className="ic" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={ic === 'search' ? 2.4 : 2} strokeLinecap="round" strokeLinejoin="round">{I[ic]}</svg>
          </i>
          {ic === 'user' && !me ? 'Kirish' : label}
          {ic === 'heart' ? <SavedCount /> : null}
        </Link>
      ))}
    </nav>
  );
}
