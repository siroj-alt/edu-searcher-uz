import InstallButton from '../../components/InstallButton';

export const metadata = {
  title: "EduSearcher ilovasi | Telefonga o'rnatish",
  description: "EduSearcher ilovasini telefoningizga o'rnating: o'quv markazlarini qidiring, xaritada eng yaqinini toping va o'qishga ariza bering.",
  alternates: { canonical: '/ilova' }
};

const STEPS_A = ["Telefoningizda Chrome orqali edusearcher.uz saytini oching.", "«Ilovani o'rnatish» tugmasini bosing yoki brauzer menyusidan (⋮) «Ilovani o'rnatish» ni tanlang.", 'EduSearcher belgisi bosh ekranda paydo bo\'ladi.'];
const STEPS_I = ['iPhone\'da Safari orqali edusearcher.uz saytini oching.', "Pastdagi «Ulashish» tugmasini bosing (yuqoriga strelka chiqqan kvadrat).", "«Bosh ekranga» ni tanlang va «Qo'shish» ni bosing."];

export default function Ilova() {
  return (
    <div className="wrap page ilova">
      <section className="ilova-hero">
        <img src="/icons/icon-512.png" alt="EduSearcher ilovasi belgisi" width="104" height="104" />
        <div>
          <h1 className="h1s">EduSearcher ilovasi</h1>
          <p className="muted">O'quv markazlarini telefoningizdan bir bosishda toping: qidiruv, xarita, saqlanganlar va shaxsiy kabinet doim qo'l ostida. Ilova tez ochiladi va internet sekin bo'lsa ham ishlaydi.</p>
          <InstallButton />
        </div>
      </section>
      <div className="ilova-grid">
        <section className="card">
          <h2 className="h2">Android</h2>
          <ol>{STEPS_A.map((s) => <li key={s}>{s}</li>)}</ol>
        </section>
        <section className="card">
          <h2 className="h2">iPhone</h2>
          <ol>{STEPS_I.map((s) => <li key={s}>{s}</li>)}</ol>
        </section>
      </div>
    </div>
  );
}
