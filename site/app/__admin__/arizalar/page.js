import AdminGate from '../../../components/AdminGate';
import Applications from '../../../components/shared/Applications';

export const metadata = { title: 'Arizalar | EduSearcher', robots: { index: false, follow: false, nocache: true } };

export default function Page() {
  return (
    <AdminGate>
      <div className="wrap page">
        <h1 className="h1s">Arizalar</h1>
        <p className="muted" style={{ margin: '6px 0 14px' }}>Sayt orqali o'quv markazlariga yuborilgan o'qishga arizalar. Har bir ariza tegishli markazning paneliga ham tushadi.</p>
        <Applications />
      </div>
    </AdminGate>
  );
}
