import Link from 'next/link';
import SaveButton from './SaveButton';
import CompareToggle from './CompareToggle';

const PIN = <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.6A2.6 2.6 0 1 1 12 6.4a2.6 2.6 0 0 1 0 5.2z" /></svg>;
const STAR = <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.5l2.9 6.4 7 .7-5.3 4.7 1.6 6.9L12 17.6l-6.2 3.6 1.6-6.9L2.1 9.6l7-.7z" /></svg>;
const SHIELD = <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6z" /><path d="M9 12l2.2 2.2L15.5 10" /></svg>;

// Ixcham markaz kartasi (OLX uslubida): rasm, nom, narx, joy. Telefonda bir qatorga ikkita sig'adi.
export default function Tile({ t, i = 0 }) {
  const href = `/centers/${t.id}`;
  return (
    <article className="tile" style={{ '--i': Math.min(i, 12), '--c': t.color }} data-center={t.id}>
      <Link href={href} className="tile-img" tabIndex={-1} aria-hidden="true">
        {t.cover ? <img src={t.cover} alt="" loading={i < 4 ? 'eager' : 'lazy'} decoding="async" />
          : <span className="tile-ph"><span className="tile-g">{t.glyph}</span>{t.logo ? <img className="tile-lgb" src={t.logo} alt="" loading="lazy" decoding="async" /> : <span className="tile-av">{t.initials}</span>}</span>}
        {t.cover && t.logo ? <img className="tile-lg" src={t.logo} alt="" loading="lazy" decoding="async" /> : null}
        {t.badge ? <span className={'tile-badge' + (t.badge === 'best' ? ' best' : '')}>{t.badge === 'best' ? 'Eng mos' : 'Tavsiya'}</span> : null}
      </Link>
      <div className="tile-fav"><SaveButton id={t.id} compact /></div>
      <div className="tile-b">
        <h3 className="tile-t"><Link href={href}>{t.name}</Link>{t.verified ? <span className="tile-v" title="Tasdiqlangan">{SHIELD}</span> : null}</h3>
        {t.sub ? <p className="tile-sub">{t.sub}</p> : null}
        <p className="tile-p">{t.price}</p>
        <p className="tile-m">
          <span className="tile-loc">{PIN}<span>{t.place}</span></span>
          {t.km ? <span className="tile-km">{t.km}</span> : null}
        </p>
        {t.rating > 0 ? <p className="tile-r">{STAR}<b>{t.rating.toFixed(1)}</b>{t.reviews ? <span>{` · ${t.reviews} sharh`}</span> : null}</p> : null}
      </div>
      <div className="tile-a">
        <Link className="tile-go" href={href + '#ariza'}>Ariza berish</Link>
        <CompareToggle id={t.id} variant="chip" />
      </div>
    </article>
  );
}
