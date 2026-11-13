'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SavedCount from './SavedCount';
import { useMe, homeFor } from '../lib/auth';

// Telefonda pastdagi suzuvchi shisha menyu: Markazlar, Xarita, Saqlangan, Profil
const I = {
  centers: <><path d="M3 21h18M5 21V8l7-4 7 4v13" /><path d="M9 21v-5h6v5M9 11h.01M15 11h.01" /></>,
  map: <><path d="M9 4l6 2 5-2v14l-5 2-6-2-5 2V6z" /><path d="M9 4v14M15 6v14" /></>,
  saved: <path d="M6 3.5h12v17l-6-4-6 4z" />,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></>
};

const ITEMS = [
  ['/search', 'Markazlar', 'centers', (p) => p === '/' || p.startsWith('/search') || p.startsWith('/centers') || p.startsWith('/markazlar')],
  ['/xarita', 'Xarita', 'map', (p) => p.startsWith('/xarita')],
  ['/saqlangan', 'Saqlangan', 'saved', (p) => p.startsWith('/saqlangan')],
  ['/kabinet', 'Profil', 'user', (p) => p.startsWith('/kabinet') || p.startsWith('/kirish') || p.startsWith('/markaz-kabineti')]
];

export default function BottomNav() {
  const path = usePathname() || '/';
  const me = useMe();
  if (path.startsWith('/boshqaruv')) return null;
  return (
    <nav className="bnav" aria-label="Asosiy menyu">
      {ITEMS.map(([href, label, ic, act]) => {
        const on = act(path);
        return (
          <Link key={href} href={ic === 'user' ? (me ? homeFor(me) : '/kirish') : href} className={on ? 'on' : ''} aria-current={on ? 'page' : undefined}>
            <i className="ic" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={on ? 2.3 : 2} strokeLinecap="round" strokeLinejoin="round">{I[ic]}</svg>
            </i>
            {label}
            {ic === 'saved' ? <SavedCount /> : null}
          </Link>
        );
      })}
    </nav>
  );
}
