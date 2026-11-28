import Link from 'next/link';
import DeleteAccount from '../../components/DeleteAccount';

export const metadata = {
  title: "Hisobni o'chirish | EduSearcher",
  description: "EduSearcher hisobingiz va unga bog'liq shaxsiy ma'lumotlarni o'chirish.",
  alternates: { canonical: '/hisobni-ochirish' }
};

export default function HisobniOchirish() {
  return (
    <div className="wrap page legal">
      <nav className="crumbs" aria-label="Sahifa yo'li"><Link href="/">Bosh sahifa</Link><span aria-hidden="true">/</span><span>Hisobni o'chirish</span></nav>
      <h1 className="h1s">Hisobni o'chirish</h1>
      <p>EduSearcher ilovasi va saytidagi hisobingizni shu sahifadan o'chirishingiz mumkin. Ilovada ham xuddi shu amal bor: Sozlamalar → «Hisobni o'chirish». Qo'shimcha ma'lumot: <Link href="/maxfiylik">Maxfiylik siyosati</Link>.</p>
      <DeleteAccount />
    </div>
  );
}
