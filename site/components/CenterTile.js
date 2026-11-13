import Link from 'next/link';
import { slugsOf, catNamesOf, regionIdsOf, priceRange } from '../lib/points';
import { colorFor, initials } from '../lib/cats';
import { regionById } from '../lib/regions';
import { Icon } from '../lib/icons';
import SaveButton from './SaveButton';

const sum = (n) => (n >= 1e6 ? (n / 1e6).toLocaleString('ru-RU', { maximumFractionDigits: 1 }) + ' mln' : Math.round(n / 1000) + ' ming');
const SHIELD = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6z" /><path d="M9 12l2.2 2.2L15.5 10" /></svg>;

// Markaz kartasi: rangli sarlavha, nom, filiallar, yo'nalishlar, oylik narx va ariza tugmasi
export default function CenterTile({ c, i = 0, slug = null }) {
  const slugs = slugsOf(c);
  const regions = regionIdsOf(c).map((id) => regionById(id)?.short).filter(Boolean);
  const where = regions.length > 2 ? `${regions.length} ta viloyatda` : regions.join(', ');
  const pr = priceRange(c, slug);
  const color = colorFor(slug || slugs[0]);
  const price = pr ? (pr[0] === pr[1] ? sum(pr[0]) : `${sum(pr[0])} dan`) + " so'm" : 'Narx kelishiladi';
  return (
    <div className="tilew">
      <Link className="ccard" style={{ '--i': i, '--c': color }} href={`/centers/${c.id}`}>
        <div className="ctop">
          <span className="av" style={{ background: color }}>
            {c.logo_url ? <img src={c.logo_url} alt="" loading="lazy" decoding="async" /> : initials(c.name)}
          </span>
          {c.is_verified || c.is_featured ? (
            <span className="cbadges">
              {c.is_featured ? <span className="vb f">Tavsiya</span> : null}
              {c.is_verified ? <span className="vb">{SHIELD}Tasdiqlangan</span> : null}
            </span>
          ) : null}
        </div>
        <div className="cbody">
          <h3>{c.name}</h3>
          <div className="cmeta">
            <Icon name="pin" />{c.branches.length} ta filial{where ? ' · ' + where : ''}
            {c.rating && Number(c.rating) > 0 ? <span className="st"><Icon name="star" />{Number(c.rating).toFixed(1)}</span> : null}
          </div>
          <div className="ctags">{catNamesOf(c).slice(0, 3).map((n) => <span key={n}>{n}</span>)}</div>
          <div className="cfoot">
            <div><small>OYLIK TO'LOV</small><b>{price}</b></div>
            <span className="go2">Ariza berish</span>
          </div>
        </div>
      </Link>
      <SaveButton id={c.id} compact />
    </div>
  );
}
