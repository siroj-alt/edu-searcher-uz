import AdminGate from '../../../components/AdminGate';
import BotUsers from '../../../components/admin/BotUsers';

export const metadata = { title: 'Telegram bot | EduSearcher', robots: { index: false, follow: false, nocache: true } };

export default function Page() {
  return (
    <AdminGate>
      <div className="wrap page">
        <h1 className="h1s">Telegram bot</h1>
        <p className="muted" style={{ margin: '6px 0 14px' }}>@edusearcherbot foydalanuvchilari. Bot orqali yuborilgan arizalar «Arizalar» bo'limida (🤖 belgisi bilan), sharhlar «Sharhlar» bo'limida ko'rinadi.</p>
        <BotUsers />
      </div>
    </AdminGate>
  );
}
