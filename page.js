import Link from 'next/link';
import SearchForm from '../components/SearchForm';

const CATS = [
  ['english', '🇬🇧', 'Ingliz tili'],
  ['ielts', '🎯', 'IELTS'],
  ['it', '💻', 'Dasturlash'],
  ['math', '📐', 'Matematika'],
  ['russian', '🇷🇺', 'Rus tili']
];
const TRUST = [
  ['✓', 'Tasdiqlangan', 'markazlar'],
  ['★', 'Real sharhlar', "o'quvchilardan"],
  ['⌖', 'Yaqin filiallar', "masofa bo'yicha"],
  ['0', 'Bepul', 'foydalanish']
];

export default function Home() {
  return (
    <div className="wrap">
      <section className="hero">
        <div>
          <div className="eyebrow">EDUSEARCHER · O'QUV MARKAZLAR</div>
          <h1>O'qishni to'g'ri markazdan <span className="script">boshlang.</span></h1>
          <p className="lead">Kurs, daraja va manzilingizni tanlang. Sizga eng yaqin va eng mos o'quv markazlarni ko'rsatamiz.</p>
          <SearchForm />
        </div>
        <div className="stage" aria-hidden="true">
          <div className="ring" />
          <div className="pedestal" />
          <div className="match">
            <small>Misol natija</small>
            <h3 style={{ margin: '6px 0' }}>IELTS 6.5 intensiv</h3>
            <p className="muted">Yunusobod filiali · Du-Chor-Ju 18:00</p>
            <p style={{ marginTop: 12 }}><span className="km">1.2 km</span> · ★ 4.8 · 900 000 so'm/oy</p>
          </div>
        </div>
      </section>

      <section className="trust">
        {TRUST.map(([i, a, b]) => (
          <div key={a}><span className="ico">{i}</span><span><b>{a}</b>{b}</span></div>
        ))}
      </section>

      <div className="sec"><h2>Yo'nalish bo'yicha</h2><i /></div>
      <section className="cats">
        {CATS.map(([slug, icon, name]) => (
          <Link key={slug} href={`/search?slug=${slug}`} className="cat">
            <span>{icon}</span>
            <div><b>{name}</b><small>Markazlarni ko'rish</small></div>
          </Link>
        ))}
      </section>

      <section className="banner">
        <h3>Yaqiningizdagi markaz<br />bir necha soniyada <span className="script">topiladi.</span></h3>
        <a href="#finder" className="btn">Qidirishni boshlash</a>
      </section>
    </div>
  );
}
