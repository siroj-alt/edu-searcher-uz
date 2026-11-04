import Link from 'next/link';

export default function Nav() {
  return (
    <header>
      <Link href="/" className="brand" aria-label="EduSearcher bosh sahifa">
        <span className="logo" aria-hidden="true">⌕</span>
        Edu<span style={{ color: 'var(--lime)' }}>Searcher</span>
      </Link>
      <nav className="nav">
        <Link href="/">Bosh sahifa</Link>
        <Link href="/search">Markaz topish</Link>
        <Link href="/panel">Kabinet</Link>
      </nav>
    </header>
  );
}
