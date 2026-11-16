import Link from 'next/link';
import { slugsOf, catNamesOf, regionIdsOf, priceRange } from '../lib/points';
import { colorFor, initials, tel, CAT_GLYPH } from '../lib/cats';
import { regionById } from '../lib/regions';
import { Icon } from '../lib/icons';
import SaveButton from './SaveButton';
import CompareToggle from './CompareToggle';

const sum = (n) => (n >= 1e6 ? (n / 1e6).toLocaleString('ru-RU', { maximumFractionDigits: 1 }) + ' mln' : Math.round(n / 1000) + ' ming');
const tgHref = (t) => (/^https?:/i.test(t) ? t : 'https://t.me/' + String(t).replace(/^@/, ''));
const fmtKm = (k) => (k < 1 ? Math.round(k * 1000) + ' m' : k.toFixed(1).replace('.', ',') + ' km');
const SHIELD = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6z" /><path d="M9 12l2.2 2.2L15.5 10" /></svg>;
const TG = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 3L10 14M21 3l-7 18-4-8-8-4z" /></svg>;

// Markaz kartasi: rasm yoki yo'nalish belgisi, nom, filiallar, narx, baho va tez aloqa tugmalari
export default function CenterTile({ c, i = 0, slug = null, reviews = 0, km = null }) {
  const slugs = slugsOf(c);
  const regions = regionIdsOf(c).map((id) => regionById(id)?.short).filter(Boolean);
  const where = regions.length > 2 ? `${regions.length} ta viloyatda` : regions.join(', ');
  const pr = priceRange(c, slug);
  const main = slug || slugs[0];
  const color = colorFor(main);
  const price = pr ? (pr[0] === pr[1] ? sum(pr[0]) : `${sum(pr[0])} dan`) + " so'm" : 'Narx kelishiladi';
  const rating = Number(c.rating) || 0;
  return (
    <div className="tilew">
      <Link className="ccard" style={{ '--i': i, '--c': color }} href={`/centers/${c.id}`}>
        <div className={'ctop' + (c.cover_url ? ' img' : ' ph')}>
          {c.cover_url ? <img src={c.cover_url} alt={c.name} loading="lazy" decoding="async" />
            : <span className="cglyph" aria-hidden="true">{CAT_GLYPH[main] || 'Edu'}</span>}
          <span className="av" style={{ background: color }}>
            {c.logo_url ? <img src={c.logo_url} alt="" loading="lazy" decoding="async" /> : initials(c.name)}
          </span>
          {c.is_verified || c.is_featured ? (
            <span className="cbadges">
              {c.is_featured ? <span className="vb f">Tavsiya</span> : null}
              {c.is_verified ? <span className="vb">{SHIELD}Tasdiqlangan</span> : null}
            </span>
          ) : null}
          {rating > 0 ? <span className="crate glass-chip"><Icon name="star" />{rating.toFixed(1)}{reviews ? <small>{` · ${reviews} sharh`}</small> : null}</span> : null}
        </div>
        <div className="cbody">
          <h3>{c.name}</h3>
          <div className="cmeta">
            <Icon name="pin" />{`${c.branches.length} ta filial${where ? ' · ' + where : ''}`}
            {km != null && Number.isFinite(km) ? <span className="kmb">{fmtKm(km)}</span> : null}
          </div>
          <div className="ctags">{catNamesOf(c).slice(0, 3).map((n) => <span key={n}>{n}</span>)}</div>
          <div className="cfoot">
            <div><small>OYLIK TO'LOV</small><b>{price}</b></div>
            <span className="go2">Batafsil</span>
          </div>
        </div>
      </Link>
      <div className="qacts">
        {c.phone ? <a className="qa" href={tel(c.phone)} aria-label={`${c.name}: qo'ng'iroq qilish`}><Icon name="phone" /><span>Qo'ng'iroq</span></a> : null}
        {c.telegram ? <a className="qa tg" href={tgHref(c.telegram)} target="_blank" rel="noopener noreferrer" aria-label={`${c.name}: Telegram`}>{TG}<span>Telegram</span></a> : null}
        {!c.phone && !c.telegram ? <Link className="qa" href={`/centers/${c.id}#ariza`}><Icon name="send" /><span>Ariza qoldirish</span></Link> : null}
        <CompareToggle id={c.id} />
      </div>
      <SaveButton id={c.id} compact />
    </div>
  );
}
