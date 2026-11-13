import Link from 'next/link';
import SavedCount from './SavedCount';
import LogoMark from './LogoMark';
import AccountLink from './AccountLink';
import ThemeToggle from './ThemeToggle';

export default function Nav() {
  return (
    <header className="top">
      <div className="topin">
        <Link className="logo" href="/" aria-label="EduSearcher bosh sahifa">
          <LogoMark size={38} id="lm-head" />
          <span>Edu<b>Searcher</b></span>
        </Link>
        <nav className="tnav" aria-label="Asosiy bo'limlar">
          <Link href="/search">Markazlar</Link>
          <Link href="/xarita">Xarita</Link>
          <Link href="/markazlar">Viloyatlar</Link>
          <Link href="/saqlangan" className="sv">Saqlanganlar<SavedCount /></Link>
        </nav>
        <div className="tacts">
          <ThemeToggle />
          <AccountLink />
        </div>
      </div>
    </header>
  );
}
