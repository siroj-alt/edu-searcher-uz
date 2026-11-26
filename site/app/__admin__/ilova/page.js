import AdminGate from '../../../components/AdminGate';
import AppAdmin from '../../../components/admin/AppAdmin';

export const metadata = { title: 'Ilova va kabinet imkoniyatlari | EduSearcher', robots: { index: false, follow: false, nocache: true } };

export default function Page() {
  return (
    <AdminGate>
      <div className="wrap page">
        <h1 className="h1s">Ilova va kabinet imkoniyatlari</h1>
        <p className="muted" style={{ margin: '6px 0 14px' }}>Ota-ona va o'quvchi hisoblari, taklif kodlari, sinov darslari, natijalar devori va barcha foydalanuvchilarga xabar yuborish.</p>
        <AppAdmin />
      </div>
    </AdminGate>
  );
}
