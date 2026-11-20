import AdminGate from '../../../components/AdminGate';
import PriceTodo from '../../../components/admin/PriceTodo';

export const metadata = { title: "Narxlarni yig'ish | EduSearcher", robots: { index: false, follow: false, nocache: true } };

export default function Page() {
  return (
    <AdminGate>
      <div className="wrap page">
        <h1 className="h1s">Narxlarni yig'ish</h1>
        <p className="muted" style={{ margin: '6px 0 14px' }}>Narxi kiritilmagan kurslar. Markazga qo'ng'iroq qiling yoki Telegram'da yozing, narxni shu yerda kiriting — u darhol saytda va narxlar indeksida ko'rinadi.</p>
        <PriceTodo />
      </div>
    </AdminGate>
  );
}
