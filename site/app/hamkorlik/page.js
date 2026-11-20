import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { jsonLd, SITE, OG_IMAGES } from '../../lib/seo';

export const dynamic = 'force-dynamic';

const title = "O'quv markazlari uchun hamkorlik — faqat yozilgan o'quvchi uchun to'lov | EduSearcher";
const description = "EduSearcher'da markazingizni bepul joylang. To'lov faqat sayt orqali kelib, o'qishni boshlagan va buni o'zi tasdiqlagan o'quvchi uchun. Birinchi 3 oy — bepul.";

export const metadata = {
  title, description,
  alternates: { canonical: '/hamkorlik' },
  openGraph: { type: 'website', url: '/hamkorlik', title, description, siteName: 'EduSearcher', locale: 'uz_UZ', images: OG_IMAGES }
};

const fmt = (n) => Math.round(n).toLocaleString('ru-RU').replace(/ /g, ' ');

export default async function Hamkorlik() {
  const { data } = await supabase.from('site_settings').select('key,value').in('key', ['billing_rate', 'billing_flat']);
  const s = Object.fromEntries((data || []).map((x) => [x.key, x.value]));
  const rate = Number(s.billing_rate) > 0 ? Number(s.billing_rate) : 0.3;
  const flat = Number(s.billing_flat) > 0 ? Number(s.billing_flat) : 80000;
  const pct = Math.round(rate * 100);
  const example = 500000;

  const steps = [
    ['Ro\'yxatdan o\'ting', "«Markazlar uchun ro'yxatdan o'tish» bo'limida hisob oching va tashkilot STIR (INN) raqamini kiriting. Saytda markazingiz bo'lsa, uni tanlang. STIR tekshirilgach kabinet ochiladi."],
    ['Narx va jadvalni kiriting', "Kurslar, oylik narx, filial manzillari va logotip. Narx ko'rsatilgan markazlar qidiruvda ko'proq so'rov oladi."],
    ['So\'rovlarni qabul qiling', "Har bir so'rov kabinetga va Telegram botga darhol keladi. Javob berilmagan so'rov haqida 24 soatdan keyin eslatamiz."],
    ['«Yozildi» deb belgilang', "O'quvchi o'qishni boshlasa, so'rovni «yozildi» holatiga o'tkazing. 14 kundan keyin bot o'quvchining o'zidan so'raydi."]
  ];
  const faq = [
    ["Joylashtirish pullimi?", "Yo'q. Markaz sahifasi, xaritada ko'rinish, so'rovlar va kabinet bepul. To'lov faqat tasdiqlangan o'quvchi uchun."],
    ["Qanday holatda to'lanmaydi?", "O'quvchi bot orqali «yozilmadim» deb javob bersa, 14 kun ichida o'qishni tashlasa yoki so'rov saytdan kelmagan bo'lsa — to'lov olinmaydi."],
    ["Hisob qachon keladi?", "Oy yakunida o'tgan oyda o'qishni boshlagan o'quvchilar ro'yxati va summasi bilan. Har bir o'quvchida ariza raqami (ES-...) bor, uni o'z bazangiz bilan solishtirishingiz mumkin."],
    ["«Reklama» belgisi nima?", "Qidiruv boshida ko'rinish alohida, ixtiyoriy xizmat. Bunday kartalarda doim «Reklama» deb yoziladi — foydalanuvchilarni chalg'itmaymiz."],
    ["«Hujjatlari tekshirilgan» belgisini qanday olaman?", "Litsenziya yoki guvohnoma nusxasini sayt administratoriga yuboring. Tekshirilgach, markaz sahifasida belgi paydo bo'ladi."]
  ];
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } }))
  };

  return (
    <div className="wrap page hk">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} />
      <nav className="crumbs" aria-label="Sahifa yo'li"><Link href="/">Bosh sahifa</Link><span aria-hidden="true">/</span><span>Hamkorlik</span></nav>
      <section className="hk-hero">
        <h1 className="h1s">O'quvchi kelmasa — to'lov yo'q</h1>
        <p className="lp-intro">EduSearcher'da markazingizni bepul joylaysiz. Biz faqat sayt orqali kelib, o'qishni boshlagan va buni o'zi tasdiqlagan o'quvchi uchun haq olamiz.</p>
        <div className="row-btns">
          <Link className="btn" href="/markaz-royxat">Markazni ro'yxatdan o'tkazish</Link>
          <Link className="btn ghost" href="/markaz-kabineti">Kabinetga kirish</Link>
        </div>
      </section>

      <div className="hk-terms">
        <div className="card hk-term">
          <b>{pct}%</b>
          <span>{`birinchi oylik to'lovdan, bir marta. Masalan, kurs oyiga ${fmt(example)} so'm bo'lsa — ${fmt(example * rate)} so'm.`}</span>
        </div>
        <div className="card hk-term">
          <b>{fmt(flat)} so'm</b>
          <span>agar kurs narxi kiritilmagan bo'lsa, har bir tasdiqlangan o'quvchi uchun qat'iy summa.</span>
        </div>
        <div className="card hk-term">
          <b>3 oy</b>
          <span>sinov davri: shartnomadan keyingi birinchi 3 oyda to'lov olinmaydi.</span>
        </div>
      </div>

      <div className="sec"><h2>Qanday ishlaydi</h2><i /></div>
      <ol className="hk-steps">
        {steps.map(([h, t]) => <li key={h}><h3>{h}</h3><p>{t}</p></li>)}
      </ol>

      <div className="sec"><h2>Siz nima olasiz</h2><i /></div>
      <ul className="hk-list">
        <li>Xaritada va tuman sahifalarida ko'rinish: «Chilonzordagi ingliz tili kurslari» kabi qidiruvlarda.</li>
        <li>Telegram botga darhol xabar, javobsiz so'rov haqida eslatma va har dushanba haftalik hisobot.</li>
        <li>Sharhlar uchun QR-kod: faqat ro'yxatdan o'tgan foydalanuvchilar sharh qoldiradi, soxta sharhlar yo'q.</li>
        <li>Kurs narxlari indeksi: hududingizda narxingiz qanday ekanini ko'rasiz.</li>
      </ul>

      <div className="sec"><h2>Savol-javob</h2><i /></div>
      <div className="hk-faq">
        {faq.map(([q, a]) => <details key={q} className="card"><summary>{q}</summary><p>{a}</p></details>)}
      </div>

      <section className="card pidx-cta">
        <h2 className="h2">Boshlaymizmi?</h2>
        <p>Markazingiz saytda bormi yoki yo'qligini qidiruvda tekshiring. Bor bo'lsa — sahifasidagi «Bu sizning markazingizmi?» tugmasini bosing.</p>
        <div className="row-btns"><Link className="btn" href="/search">Markazimni topish</Link><Link className="btn ghost" href="/narxlar">Narxlar indeksi</Link></div>
      </section>
      <p className="muted" style={{ fontSize: 13, marginTop: 14 }}>{`Shartlar ${SITE.replace('https://', '')} bilan tuziladigan shartnomada aniq belgilanadi.`}</p>
    </div>
  );
}
