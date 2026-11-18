import AdminGate from '../../../components/AdminGate';
import CenterRequests from '../../../components/admin/CenterRequests';

export const metadata = { title: "Markaz so'rovlari | EduSearcher", robots: { index: false, follow: false, nocache: true } };

export default function Page() {
  return (
    <AdminGate>
      <div className="wrap page">
        <h1 className="h1s">Markazlar so'rovlari</h1>
        <p className="muted" style={{ margin: '6px 0 14px' }}>O'quv markazlari sayt orqali ro'yxatdan o'tish uchun yuborgan so'rovlar. Tasdiqlansa, markaz saytga qo'shiladi va yuboruvchiga markaz kabineti ochiladi.</p>
        <CenterRequests />
      </div>
    </AdminGate>
  );
}
