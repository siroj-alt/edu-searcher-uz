import AuthBox from '../../components/AuthBox';

export const metadata = {
  title: 'Kabinetga kirish | EduSearcher',
  description: "EduSearcher kabinetiga kirish yoki ro'yxatdan o'tish.",
  robots: { index: false, follow: true }
};

export default function Kirish({ searchParams }) {
  const next = typeof searchParams?.next === 'string' ? searchParams.next.slice(0, 200) : '';
  return (
    <div className="wrap page">
      <AuthBox next={next} />
    </div>
  );
}
