import CenterPanel from '../../components/center/CenterPanel';

export const metadata = {
  title: "O'quv markazi kabineti | EduSearcher",
  description: "O'quv markazi paneli: arizalar, o'quvchilar, to'lovlar va markaz ma'lumotlari.",
  robots: { index: false, follow: false }
};

export default function MarkazKabineti({ searchParams }) {
  const id = typeof searchParams?.id === 'string' ? searchParams.id : '';
  return <CenterPanel centerParam={id} />;
}
