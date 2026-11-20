import AdminGate from '../../../components/AdminGate';
import Billing from '../../../components/admin/Billing';

export const metadata = { title: 'Oylik hisob | EduSearcher', robots: { index: false, follow: false, nocache: true } };

export default function Page() {
  return (
    <AdminGate>
      <div className="wrap page">
        <h1 className="h1s">Oylik hisob</h1>
        <p className="muted" style={{ margin: '6px 0 14px' }}>Sayt orqali kelib, o'qishni boshlagan o'quvchilar bo'yicha markazlarga hisob. O'quvchi «yozilmadim» desa yoki 14 kun ichida tashlasa, hisobga kirmaydi.</p>
        <Billing />
      </div>
    </AdminGate>
  );
}
