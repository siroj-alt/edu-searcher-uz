import AdminGate from '../../../components/AdminGate';
import SiteSettings from '../../../components/admin/SiteSettings';

export const metadata = { title: 'Sozlamalar | EduSearcher', robots: { index: false, follow: false, nocache: true } };

export default function Page() {
  return (
    <AdminGate>
      <div className="wrap page">
        <h1 className="h1s">Sozlamalar</h1>
        <p className="muted" style={{ margin: '6px 0 14px' }}>Google va Yandex tasdiqlash kodlari, Yandex Metrika hisoblagichi va hamkorlik tariflari.</p>
        <SiteSettings />
      </div>
    </AdminGate>
  );
}
