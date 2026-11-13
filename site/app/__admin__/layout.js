import './admin.css';
import AdminNav from '../../components/AdminNav';

export const metadata = {
  title: 'Boshqaruv | EduSearcher',
  robots: { index: false, follow: false, nocache: true }
};

// Admin panel saytdan alohida ko'rinishda: chapda bo'limlar menyusi, o'ngda ish maydoni
export default function Layout({ children }) {
  return (
    <div className="adm">
      <AdminNav />
      <div className="adm-main">{children}</div>
    </div>
  );
}
