'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TESTS, grade, qText } from '../lib/quiz';

const LEVEL_TXT = { beginner: "Boshlang'ich", intermediate: "O'rta", advanced: 'Yuqori' };
const CEFR_TXT = {
  A1: "Endi boshlayapsiz. Asoslardan boshlaydigan guruh sizga mos.",
  A2: "Oddiy gaplarni tushunasiz. Grammatikani mustahkamlash vaqti.",
  B1: "Yaxshi asos bor. IELTS'ga tayyorlanishni boshlasa bo'ladi.",
  B2: "Kuchli daraja! IELTS 6.0–7.0 ga tayyorlov kurslari mos.",
  C1: "A'lo! Yuqori ball uchun intensiv IELTS kurslarini ko'ring."
};
const CEFR = ['A1', 'A2', 'B1', 'B2', 'C1'];
const LAST = 'es-test-last';

// Daraja testi: ingliz tili (CEFR) va matematika — ilovadagi test bilan bir xil savollar
export default function LevelTest() {
  const [key, setKey] = useState(null);
  const [i, setI] = useState(0);
  const [ans, setAns] = useState([]);
  const [res, setRes] = useState(null);
  const [last, setLast] = useState(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => { try { setLast(JSON.parse(localStorage.getItem(LAST) || 'null')); } catch { /* jim */ } }, []);

  const test = key ? TESTS[key] : null;
  function start(k) { setKey(k); setI(0); setAns([]); setRes(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function advance(a) {
    if (i + 1 < test.q.length) setI(i + 1);
    else {
      const r = { ...grade(key, a), key, at: Date.now() };
      setRes(r); setLast(r);
      try { localStorage.setItem(LAST, JSON.stringify(r)); } catch { /* jim */ }
    }
  }
  function pick(o) {
    const a = [...ans]; a[i] = o; setAns(a);
    setTimeout(() => advance(a), 260);
  }
  async function share() {
    const t = TESTS[res.key];
    const text = `EduSearcher daraja testi (${t.title.uz}): ${res.key === 'english' ? res.label : LEVEL_TXT[res.label]} — ${res.score}/${res.total}. O'zingiz ham sinab ko'ring:`;
    const url = 'https://edusearcher.uz/daraja-testi';
    try {
      if (navigator.share) await navigator.share({ title: 'Daraja testi', text, url });
      else { await navigator.clipboard.writeText(`${text} ${url}`); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    } catch { /* bekor qilindi */ }
  }

  if (!test) {
    return (
      <div className="wrap page lt">
        <h1 className="h1s">Daraja testi</h1>
        <p className="muted" style={{ margin: '6px 0 18px', maxWidth: 620 }}>Savollar osondan qiyinga qarab boradi. Natijaga qarab sizga mos darajadagi guruhlari bor o'quv markazlarini tavsiya qilamiz. Bepul, ro'yxatdan o'tish shart emas.</p>
        <div className="lt-pick">
          {Object.values(TESTS).map((t) => (
            <button key={t.slug} type="button" className="card lt-card" onClick={() => start(t.slug)} style={{ '--tc': t.color }}>
              <span className="lt-g">{t.glyph}</span>
              <b>{t.title.uz}</b>
              <small className="muted">{t.sub.uz}</small>
              <em>Testni boshlash ›</em>
            </button>
          ))}
        </div>
        {last && TESTS[last.key] ? (
          <p className="muted" style={{ marginTop: 16 }}>Oxirgi natijangiz ({TESTS[last.key].title.uz}): <b>{last.key === 'english' ? last.label : LEVEL_TXT[last.label]}</b>, {last.score}/{last.total}.</p>
        ) : null}
      </div>
    );
  }

  if (res) {
    const lvlIdx = CEFR.indexOf(res.label);
    const href = `/search?cat=${test.cats[0]}&level=${res.level}`;
    return (
      <div className="wrap page lt">
        <div className="lt-res" style={{ '--tc': test.color }}>
          <span className="lt-res-g" aria-hidden="true">{test.glyph}</span>
          <small>Sizning darajangiz</small>
          <b className={res.key === 'english' ? 'big' : ''}>{res.key === 'english' ? res.label : LEVEL_TXT[res.label]}</b>
          {res.key === 'english' ? <div className="lt-cefr">{CEFR.map((l, k) => <span key={l} className={k <= lvlIdx ? 'on' : ''}>{l}</span>)}</div> : null}
          <p><b>{res.score} / {res.total}</b> to'g'ri javob</p>
          {res.key === 'english' && CEFR_TXT[res.label] ? <p>{CEFR_TXT[res.label]}</p> : null}
        </div>
        <div className="row" style={{ justifyContent: 'flex-start', gap: 10, marginTop: 14 }}>
          <Link className="btn" href={href}>{LEVEL_TXT[res.level]} darajali guruhlarni ko'rish</Link>
          <button type="button" className="btn ghost" onClick={share}>{copied ? 'Nusxalandi' : 'Ulashish'}</button>
          <button type="button" className="btn ghost" onClick={() => start(key)}>Qayta topshirish</button>
          <button type="button" className="btn ghost" onClick={() => setKey(null)}>Boshqa test</button>
        </div>
      </div>
    );
  }

  const q = test.q[i];
  return (
    <div className="wrap page lt">
      <div className="lt-top">
        <button type="button" className="btn ghost sm" onClick={() => setKey(null)}>‹ Testlar</button>
        <b>{test.title.uz}</b>
        <span style={{ color: test.color, fontWeight: 800 }}>{i + 1}/{test.q.length}</span>
      </div>
      <div className="lt-prog" aria-hidden="true">
        {test.q.map((_, k) => <span key={k} style={{ background: k < i ? test.color : k === i ? test.color + '66' : undefined }} />)}
      </div>
      {q.lv ? <span className="lt-lv" style={{ color: test.color, background: test.color + '22' }}>{key === 'english' ? `${q.lv} daraja` : LEVEL_TXT[q.lv] || q.lv}</span> : null}
      <div className="card lt-q"><h2>{qText(q, 'uz')}</h2></div>
      <div className="lt-opts">
        {q.o.map((o, k) => {
          const on = ans[i] === k;
          return (
            <button key={o} type="button" className={'lt-o' + (on ? ' on' : '')} style={{ '--tc': test.color }} onClick={() => pick(k)}>
              <span>{'ABCD'[k]}</span>{o}{on ? <em aria-hidden="true">✓</em> : null}
            </button>
          );
        })}
      </div>
      <div className="row" style={{ gap: 10, marginTop: 14 }}>
        <button type="button" className="btn ghost" disabled={i === 0} onClick={() => setI(i - 1)}>‹ Oldingi</button>
        <button type="button" className="btn" disabled={ans[i] == null} onClick={() => advance(ans)} style={{ background: test.color, borderColor: test.color }}>{i + 1 < test.q.length ? 'Keyingi savol ›' : "Natijani ko'rish"}</button>
      </div>
    </div>
  );
}
