import CenterSignup from '../../components/CenterSignup';

export const metadata = {
  title: "O'quv markazlari uchun ro'yxatdan o'tish | EduSearcher",
  description: "O'quv markazingizni EduSearcher'da STIR (INN) bilan ro'yxatdan o'tkazing: qidiruv va xaritada chiqing, arizalarni kabinet va Telegram orqali qabul qiling.",
  alternates: { canonical: '/markaz-royxat' }
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function Page({ searchParams }) {
  const m = typeof searchParams?.markaz === 'string' && UUID.test(searchParams.markaz) ? searchParams.markaz : '';
  return <div className="wrap page"><CenterSignup markaz={m} /></div>;
}
