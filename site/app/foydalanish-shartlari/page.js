import Link from 'next/link';

const UPDATED = '25.11.2026';
const EMAIL = 'yunusnorbekov1977@gmail.com';

export const metadata = {
  title: 'Foydalanish shartlari | EduSearcher',
  description: "EduSearcher saytidan foydalanish shartlari: o'quvchilar va o'quv markazlari uchun.",
  alternates: { canonical: '/foydalanish-shartlari' }
};

const S = ({ t, children }) => <section className="legal-s"><h2>{t}</h2>{children}</section>;

export default function Shartlar() {
  return (
    <div className="wrap page legal">
      <nav className="crumbs" aria-label="Sahifa yo'li"><Link href="/">Bosh sahifa</Link><span aria-hidden="true">/</span><span>Foydalanish shartlari</span></nav>
      <h1 className="h1s">Foydalanish shartlari</h1>
      <p className="muted">Oxirgi yangilanish: {UPDATED}</p>
      <p>EduSearcher (edusearcher.uz) va @edusearcherbot'dan foydalanish orqali siz quyidagi shartlarga rozilik bildirasiz. Shaxsiy ma'lumotlar bilan ishlash <Link href="/maxfiylik">Maxfiylik siyosati</Link>da tushuntirilgan.</p>

      <S t="1. Xizmat nima">
        <p>EduSearcher — o'quv markazlari katalogi va xaritasi. Sayt o'quvchilarga markaz topish, ularni solishtirish va ariza yuborishda yordam beradi. Sayt o'zi ta'lim xizmatini ko'rsatmaydi va markaz bilan o'quvchi o'rtasidagi shartnomaning tomoni emas.</p>
      </S>

      <S t="2. Hisob">
        <ul>
          <li>Ro'yxatdan o'tishda to'g'ri ma'lumot kiriting va parolingizni boshqalarga bermang.</li>
          <li>Hisobingiz orqali qilingan amallar uchun o'zingiz javobgarsiz.</li>
          <li>Qoidalarni buzgan hisoblar ogohlantirishsiz cheklanishi yoki o'chirilishi mumkin.</li>
        </ul>
      </S>

      <S t="3. Markazlar haqidagi ma'lumot">
        <p>Narxlar, jadval, manzil va boshqa ma'lumotlarni markazlarning o'zi yoki ochiq manbalar beradi. Ularni dolzarb saqlashga harakat qilamiz, lekin to'liq aniqligiga kafolat bermaymiz. Shartnoma tuzishdan oldin narx va shartlarni markazning o'zidan aniqlang.</p>
      </S>

      <S t="4. Arizalar va filialga ko'chish">
        <ul>
          <li>Ariza markaz bilan bog'lanish so'rovi hisoblanadi; markaz uni qabul qilishi yoki rad etishi mumkin.</li>
          <li>Filialga ko'chish arizasi sayt ma'muriyati va markaz imkoniyatlari bo'yicha ko'rib chiqiladi; guruh va jadval markaz bilan kelishiladi.</li>
          <li>Soxta yoki boshqa shaxs nomidan ariza yuborish taqiqlanadi.</li>
        </ul>
      </S>

      <S t="5. Sharhlar">
        <ul>
          <li>Sharh faqat shaxsiy tajribangizga asoslangan bo'lsin.</li>
          <li>Haqorat, tuhmat, reklama, boshqalarning shaxsiy ma'lumotlari va soxta sharhlar taqiqlanadi.</li>
          <li>Qoidaga zid sharhlar o'chiriladi.</li>
        </ul>
      </S>

      <S t="6. O'quv markazlari uchun">
        <ul>
          <li>Markaz o'zi haqida to'g'ri ma'lumot, jumladan haqiqiy STIR (INN) va yuridik ma'lumotlarni beradi.</li>
          <li>Markaz arizachilarning ma'lumotlaridan faqat shu ariza bo'yicha bog'lanish uchun foydalanadi va ularni boshqalarga bermaydi.</li>
          <li>Hamkorlik va to'lov shartlari alohida kelishuv bilan belgilanadi.</li>
        </ul>
      </S>

      <S t="7. Javobgarlik">
        <p>Sayt «borligicha» taqdim etiladi. Markaz ko'rsatgan ta'lim sifati, markaz bilan o'quvchi o'rtasidagi to'lov va nizolar uchun EduSearcher javobgar emas, biroq nizoni hal qilishda imkon qadar yordam beradi.</p>
      </S>

      <S t="8. O'zgartirishlar va aloqa">
        <p>Shartlar o'zgarsa, shu sahifada yangilanish sanasi ko'rsatiladi. Shartlar O'zbekiston Respublikasi qonunchiligiga muvofiq talqin qilinadi. Aloqa: {EMAIL}, Telegram: @edusearcherbot.</p>
      </S>
    </div>
  );
}
