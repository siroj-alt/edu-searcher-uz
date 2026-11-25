import Link from 'next/link';

const UPDATED = '25.11.2026';
const EMAIL = 'yunusnorbekov1977@gmail.com';

export const metadata = {
  title: 'Maxfiylik siyosati | EduSearcher',
  description: "EduSearcher qanday ma'lumotlarni yig'adi, ulardan qanday foydalanadi va kimga beradi.",
  alternates: { canonical: '/maxfiylik' }
};

const S = ({ t, children }) => <section className="legal-s"><h2>{t}</h2>{children}</section>;

export default function Maxfiylik() {
  return (
    <div className="wrap page legal">
      <nav className="crumbs" aria-label="Sahifa yo'li"><Link href="/">Bosh sahifa</Link><span aria-hidden="true">/</span><span>Maxfiylik siyosati</span></nav>
      <h1 className="h1s">Maxfiylik siyosati</h1>
      <p className="muted">Oxirgi yangilanish: {UPDATED}</p>
      <p>EduSearcher (edusearcher.uz, keyingi o'rinlarda — «sayt») O'zbekistondagi o'quv markazlarini topish va ularga ariza yuborish xizmati. Ushbu sahifa sayt va @edusearcherbot Telegram boti qaysi shaxsiy ma'lumotlarni yig'ishi, ulardan nima uchun foydalanishi va kimga berishini tushuntiradi.</p>

      <S t="1. Qanday ma'lumotlarni yig'amiz">
        <ul>
          <li><b>Hisob ma'lumotlari:</b> ism familiya, login, telefon raqami, parol (shifrlangan holda). Google yoki Apple orqali kirsangiz — o'sha xizmat bergan ism va elektron pochta manzili.</li>
          <li><b>Arizalar:</b> markazga yuborgan arizangizdagi ism, telefon, tanlangan kurs va izoh, ariza qayerdan kelgani (masalan, reklama havolasi).</li>
          <li><b>O'qish ma'lumotlari:</b> markaz sizni qabul qilganda kiritadigan kurs, guruh, filial, oylik to'lov va to'lovlar holati; filialga ko'chish arizalari.</li>
          <li><b>Sharhlar:</b> markaz haqidagi baho va fikringiz hamda ko'rsatgan ismingiz — ular saytda hammaga ko'rinadi.</li>
          <li><b>O'quv markazlari uchun:</b> tashkilot nomi, STIR (INN), tashkiliy-huquqiy shakli, rahbar ismi, aloqa ma'lumotlari, manzil va filiallar.</li>
          <li><b>Telegram:</b> kabinetingizni botga ulasangiz — Telegram foydalanuvchi raqamingiz (ID), bildirishnomalar yuborish uchun.</li>
          <li><b>Texnik ma'lumotlar:</b> til, mavzu, saqlangan markazlar va kirish sessiyasi brauzeringizda (cookie va localStorage) saqlanadi. Markaz sahifalari necha marta ochilgani va «qo'ng'iroq», «yo'nalish» kabi tugmalar bosilgani shaxsingizga bog'lanmagan holda hisoblanadi.</li>
          <li><b>Joylashuv:</b> «yaqin markazlar» uchun ruxsat bersangiz, joylashuvingiz faqat masofani hisoblashda ishlatiladi va bizning bazamizda saqlanmaydi.</li>
        </ul>
      </S>

      <S t="2. Ma'lumotlardan nima uchun foydalanamiz">
        <ul>
          <li>Hisobingizni ochish, kirish va kabinet ishlashi uchun.</li>
          <li>Arizangizni siz tanlagan markazga yetkazish va uning holatini ko'rsatish uchun.</li>
          <li>Arizalar, o'qish, to'lovlar va filialga ko'chish haqida sayt va Telegram orqali xabar berish uchun.</li>
          <li>Soxta sharh va spamdan himoyalanish, markazlar ma'lumotini tekshirish uchun.</li>
          <li>Saytni yaxshilash uchun umumiy (shaxsga bog'lanmagan) statistika yuritish uchun.</li>
        </ul>
        <p>Ma'lumotlaringizni reklama maqsadida sotmaymiz va boshqalarga bermaymiz.</p>
      </S>

      <S t="3. Ma'lumotlarni kim ko'radi">
        <ul>
          <li><b>Siz ariza yuborgan o'quv markazi</b> — arizangizdagi ism, telefon, kurs va izoh; sizni qabul qilsa — o'qish va to'lov ma'lumotlari.</li>
          <li><b>Sayt ma'muriyati</b> — xizmatni yuritish, arizalar va so'rovlarni ko'rib chiqish uchun.</li>
          <li><b>Xizmat ko'rsatuvchilar:</b> Supabase (ma'lumotlar bazasi va kirish tizimi), Vercel (saytni joylashtirish), Telegram (bildirishnomalar), Google va Apple (ular orqali kirsangiz), Yandex Metrika (yoqilgan bo'lsa, umumiy statistika). Ular ma'lumotni faqat o'z xizmatini ko'rsatish uchun qayta ishlaydi.</li>
          <li>Qonunda belgilangan hollarda — vakolatli davlat organlari.</li>
        </ul>
      </S>

      <S t="4. Google va Apple orqali kirish">
        <p>Google yoki Apple orqali kirganingizda biz faqat ismingiz, elektron pochta manzilingiz va hisob identifikatorini olamiz. Kontaktlaringiz, fayllaringiz yoki boshqa ma'lumotlaringizga kirish so'ramaymiz. Google'dan olingan ma'lumotlardan foydalanish Google API Services User Data Policy talablariga, jumladan Limited Use talablariga mos keladi.</p>
      </S>

      <S t="5. Saqlash muddati va himoya">
        <p>Ma'lumotlar hisobingiz faol bo'lgan muddatda saqlanadi. Hisobni o'chirishni so'rasangiz, 30 kun ichida shaxsiy ma'lumotlaringiz o'chiriladi; qonun yoki markaz bilan hisob-kitob talab qiladigan yozuvlar (masalan, to'lov qaydlari) shaxsga bog'lanmagan holda qolishi mumkin. Ma'lumotlar shifrlangan aloqa (HTTPS) orqali uzatiladi, bazaga kirish huquqlar bilan cheklangan.</p>
      </S>

      <S t="6. Sizning huquqlaringiz">
        <ul>
          <li>Ism va telefoningizni kabinetdagi «Profil» bo'limida ko'rish va o'zgartirish.</li>
          <li>Telegram bildirishnomalarini istalgan vaqtda uzish.</li>
          <li>Arizangizni bekor qilish, sharhingizni o'chirishni so'rash.</li>
          <li>Hisobingiz va ma'lumotlaringizni o'chirishni so'rash — {EMAIL} manziliga yozing.</li>
        </ul>
      </S>

      <S t="7. Bolalar">
        <p>16 yoshgacha bo'lgan bolalar uchun arizani ota-onasi yoki vasiysi yuborishi tavsiya etiladi. Agar bola ma'lumotlari ruxsatsiz kiritilgan bo'lsa, bizga yozing — ularni o'chiramiz.</p>
      </S>

      <S t="8. O'zgartirishlar va aloqa">
        <p>Siyosat o'zgarsa, shu sahifada yangilanish sanasi ko'rsatiladi. Savollar bo'yicha: {EMAIL} yoki Telegram: @edusearcherbot.</p>
        <p>Shuningdek: <Link href="/foydalanish-shartlari">Foydalanish shartlari</Link>.</p>
      </S>
    </div>
  );
}
