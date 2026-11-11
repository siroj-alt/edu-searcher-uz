import Link from 'next/link';
import { Icon } from '../lib/icons';
import SavedCount from './SavedCount';
import LogoMark from './LogoMark';
import AccountLink from './AccountLink';

export default function Nav() {
  return (
    <header className="top">
      <div className="topin">
        <Link className="logo" href="/" aria-label="EduSearcher bosh sahifa">
          <LogoMark size={40} id="lm-head" />
          <span>Edu<b>Searcher</b></span>
        </Link>
        <nav className="tnav">
          <Link href="/">Bosh sahifa</Link>
          <Link href="/search">Markazlar</Link>
          <Link href="/markazlar">Viloyatlar</Link>
          <Link href="/xarita">Xarita</Link>
          <Link href="/saqlangan" className="sv">Saqlangan<SavedCount /></Link>
        </nav>
        <Link className="cta" href="/#finder"><Icon name="search" />Markaz topish</Link>
        <AccountLink />
      </div>
    </header>
  );
}
