import AdminGate from '../../../components/AdminGate';
import BranchTransfers from '../../../components/admin/BranchTransfers';

export const metadata = { title: "Filialga ko'chirish | EduSearcher", robots: { index: false, follow: false, nocache: true } };

export default function Page() {
  return (
    <AdminGate>
      <div className="wrap page">
        <h1 className="h1s">Filialga ko'chirish arizalari</h1>
        <p className="muted" style={{ margin: '6px 0 14px' }}>O'quvchilar kabinetidan yuborgan arizalar. Tasdiqlansa, o'qish yangi filialga o'tadi; o'quvchi va markazga Telegram orqali xabar boradi.</p>
        <BranchTransfers />
      </div>
    </AdminGate>
  );
}
