import UserCabinet from '../../components/cabinet/UserCabinet';

export const metadata = {
  title: 'Shaxsiy kabinet | EduSearcher',
  description: "Saqlangan markazlar, arizalar, o'qiyotgan kurslar va oylik to'lovlar.",
  robots: { index: false, follow: false }
};

export default function Kabinet({ searchParams }) {
  const tab = typeof searchParams?.b === 'string' ? searchParams.b : '';
  return <UserCabinet initialTab={tab} />;
}
