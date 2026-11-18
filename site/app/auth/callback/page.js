import AuthCallback from '../../../components/AuthCallback';

export const metadata = { title: 'Kirilmoqda | EduSearcher', robots: { index: false, follow: false } };

export default function Page() {
  return <div className="wrap page"><AuthCallback /></div>;
}
