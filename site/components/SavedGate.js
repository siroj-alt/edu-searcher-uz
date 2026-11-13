'use client';
import Link from 'next/link';
import { useMe } from '../lib/auth';
import SavedList from './SavedList';

// Saqlanganlar ro'yxati faqat kabinetga kirgan foydalanuvchiga ko'rinadi
export default function SavedGate() {
  const me = useMe();
  if (me === undefined) return <div className="card muted">Yuklanmoqda...</div>;
  if (!me) {
    return (
      <div className="card empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.3-9.4C1.5 7.8 3.6 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.4 0 5.5 3.3 4.3 6.6-1.8 4.8-9.3 9.4-9.3 9.4z" /></svg>
        <h2 className="h2">Saqlanganlarni ko'rish uchun kabinetga kiring</h2>
        <p className="muted">Yoqqan markazlarni saqlang va ularni istalgan qurilmadan yonma-yon taqqoslang.</p>
        <p style={{ marginTop: 14 }}><Link className="btn" href="/kirish?next=%2Fsaqlangan">Kirish yoki ro'yxatdan o'tish</Link></p>
      </div>
    );
  }
  return <SavedList />;
}
