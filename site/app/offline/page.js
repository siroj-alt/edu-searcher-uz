import Link from 'next/link';

export const metadata = { title: "Internet yo'q | EduSearcher", robots: { index: false } };

export default function Offline() {
  return (
    <div className="wrap page">
      <div className="card empty-state" style={{ maxWidth: 520, margin: '40px auto' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: 'var(--muted)' }}><path d="M2 8.8a15 15 0 0 1 20 0M5.5 12.4a10 10 0 0 1 13 0M9 16a5 5 0 0 1 6 0" /><path d="M12 20h.01" /><path d="M3 3l18 18" /></svg>
        <h1 className="h2">Internet aloqasi yo'q</h1>
        <p className="muted">Telefoningiz internetga ulanganini tekshiring. Avval ochgan sahifalaringiz internetsiz ham ochiladi.</p>
        <p style={{ marginTop: 14 }}><Link className="btn" href="/">Qayta urinish</Link></p>
      </div>
    </div>
  );
}
