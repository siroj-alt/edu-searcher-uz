import Link from 'next/link';
import { SECTIONS, SECTION_ICON } from '../lib/sections';

const Ic = ({ d }) => <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>;

// Kurs bo'limlari: dumaloq rangli belgilar (OLX kategoriyalari kabi). variant="grid" — bosh sahifa uchun katta to'r.
export default function SectionRow({ active = '', hrefFor = (s) => `/search?bolim=${s}`, variant = 'row', counts = null }) {
  return (
    <nav className={'secs secs-' + variant} aria-label="Kurs bo'limlari">
      {SECTIONS.map((s) => (
        <Link key={s.slug} href={hrefFor(active === s.slug && variant === 'row' ? '' : s.slug)} className={'sec-i' + (active === s.slug ? ' on' : '')} style={{ '--c': s.color }} aria-current={active === s.slug ? 'true' : undefined}>
          <span className="sec-ic"><Ic d={SECTION_ICON[s.icon]} /></span>
          <span className="sec-n">{variant === 'grid' ? s.name : s.short}</span>
          {counts && counts[s.slug] != null ? <small className="sec-c">{`${counts[s.slug]} ta markaz`}</small> : null}
        </Link>
      ))}
    </nav>
  );
}
