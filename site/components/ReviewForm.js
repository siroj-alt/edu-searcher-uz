'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { useMe, rpcMsg } from '../lib/auth';
import { StarFill } from './Glyphs';

const LABELS = ['', 'Juda yomon', 'Yomon', "O'rtacha", 'Yaxshi', "A'lo"];

// Sharh faqat kabinetga kirgan foydalanuvchidan qabul qilinadi (soxta sharhlardan himoya).
// Moderatsiyadan o'tgandan keyin sahifada ko'rinadi.
export default function ReviewForm({ centerId }) {
  const me = useMe();
  const [stars, setStars] = useState(0);
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [st, setSt] = useState({ busy: false, ok: false, err: '' });
  const [next, setNext] = useState(`/centers/${centerId}`);

  useEffect(() => { setNext(`/centers/${centerId}#sharhlar`); }, [centerId]);
  useEffect(() => { if (me && !name) setName(me.full_name || ''); }, [me]); // eslint-disable-line react-hooks/exhaustive-deps

  if (me === undefined) return <p className="muted">Yuklanmoqda...</p>;
  if (!me) {
    return (
      <div className="revlogin">
        <p className="muted">Soxta sharhlardan himoya uchun sharhni faqat kabinetiga kirgan foydalanuvchilar qoldira oladi. Ro'yxatdan o'tish bir daqiqa oladi.</p>
        <div className="row" style={{ marginTop: 10, gap: 8, display: 'flex', flexWrap: 'wrap' }}>
          <Link className="btn sm" href={`/kirish?next=${encodeURIComponent(next)}`}>Kirish yoki ro'yxatdan o'tish</Link>
        </div>
      </div>
    );
  }

  async function send(e) {
    e.preventDefault();
    if (!stars) return setSt({ busy: false, ok: false, err: "Baho qo'ying (1 dan 5 gacha yulduz)." });
    if (name.trim().length < 2) return setSt({ busy: false, ok: false, err: 'Ismingizni kiriting.' });
    setSt({ busy: true, ok: false, err: '' });
    const { error } = await supabase.rpc('submit_review', {
      p_center: centerId, p_name: name.trim(), p_stars: stars, p_comment: comment.trim() || null, p_visitor: null
    });
    if (error) return setSt({ busy: false, ok: false, err: rpcMsg(error, "Sharh yuborilmadi. Birozdan so'ng qayta urinib ko'ring.") });
    setSt({ busy: false, ok: true, err: '' });
  }

  if (st.ok) return <div className="formmsg ok" role="status">Rahmat! Sharhingiz qabul qilindi va tekshiruvdan so'ng sahifada chiqadi.</div>;

  return (
    <form className="lf" onSubmit={send} noValidate>
      <div className="stars-in" role="radiogroup" aria-label="Baho">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={stars === n} aria-label={`${n} — ${LABELS[n]}`}
            className={'star-b' + (n <= stars ? ' on' : '')} onClick={() => setStars(n)}><StarFill /></button>
        ))}
        <span className="muted" style={{ marginLeft: 8 }}>{stars ? LABELS[stars] : 'Baho qo\'ying'}</span>
      </div>
      <label>Ismingiz<input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoComplete="name" /></label>
      <label>Fikringiz (ixtiyoriy)<textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} placeholder="O'qituvchilar, darslar, natija haqida yozing" /></label>
      <button className="btn" disabled={st.busy}>{st.busy ? 'Yuborilmoqda...' : 'Sharh yuborish'}</button>
      {st.err ? <div className="formmsg err" role="alert">{st.err}</div> : null}
    </form>
  );
}
