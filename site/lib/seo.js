// SEO yordamchilari: domen, yo'nalish slug'lari, JSON-LD
export const SITE = 'https://edusearcher.uz';

// Ma'lumotlar bazasidagi slug -> o'zbekcha URL slug
export const CAT_URL = {
  english: 'ingliz-tili', ielts: 'ielts', it: 'it', math: 'matematika', russian: 'rus-tili',
  chinese: 'xitoy-tili', korean: 'koreys-tili', german: 'nemis-tili', arabic: 'arab-tili', sat: 'sat',
  chemistry: 'kimyo', biology: 'biologiya', history: 'tarix', law: 'huquq', physics: 'fizika', uzbek: 'ona-tili',
  cybersecurity: 'kiberxavfsizlik', ai: 'suniy-intellekt', networking: 'tarmoq-administratorligi', video: 'video-montaj',
  design: 'grafik-dizayn', marketing: 'smm-marketing', robotics: 'robototexnika', accounting: 'buxgalteriya',
  mental: 'mental-arifmetika', turkish: 'turk-tili', japanese: 'yapon-tili', french: 'fransuz-tili', computer: 'kompyuter-savodxonligi'
};
export const CAT_FROM_URL = Object.fromEntries(Object.entries(CAT_URL).map(([k, v]) => [v, k]));

// "Ingliz tili" -> "ingliz tili" (gap ichida ishlatish uchun)
export const lowerFirst = (s) => {
  const t = String(s || '');
  if (/^[A-Z]{2,}/.test(t)) return t; // IELTS, SAT, IT kabi qisqartmalar o'zgarmaydi
  return t.charAt(0).toLowerCase() + t.slice(1);
};

// Viloyat nomidan "...dagi" shakli: "Navoiy viloyati" -> "Navoiy viloyatidagi"
export const inPlace = (region) => (region ? region.name + 'dagi' : "O'zbekistondagi");

// <script type="application/ld+json"> ichiga xavfsiz joylash
export const jsonLd = (o) => JSON.stringify(o).replace(/</g, '\\u003c');

export const fmtDate = (d) => {
  const t = d ? new Date(d) : null;
  if (!t || isNaN(t)) return '';
  const p = (n) => String(n).padStart(2, '0');
  return `${p(t.getDate())}.${p(t.getMonth() + 1)}.${t.getFullYear()}`;
};

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Gap ichida yo'nalish nomi: "Navoiy viloyatidagi ingliz tili kurslari"
export const CAT_PHRASE = {
  english: 'ingliz tili', russian: 'rus tili', it: 'IT va dasturlash', math: 'matematika', ielts: 'IELTS',
  chinese: 'xitoy tili', korean: 'koreys tili', german: 'nemis tili', arabic: 'arab tili', sat: 'SAT',
  chemistry: 'kimyo', biology: 'biologiya', history: 'tarix', law: 'huquq', physics: 'fizika', uzbek: 'ona tili va adabiyot',
  cybersecurity: 'kiberxavfsizlik', ai: "sun'iy intellekt", networking: 'tarmoq administratorligi', video: 'video montaj',
  design: 'grafik dizayn', marketing: 'SMM va marketing', robotics: 'robototexnika', accounting: 'buxgalteriya',
  mental: 'mental arifmetika', turkish: 'turk tili', japanese: 'yapon tili', french: 'fransuz tili', computer: 'kompyuter savodxonligi'
};
export const catPhrase = (cat) => CAT_PHRASE[cat?.slug] || lowerFirst(cat?.name || '');

// Ijtimoiy tarmoqlar uchun umumiy rasm (app/opengraph-image.js)
export const OG_IMAGES = [{ url: '/opengraph-image', width: 1200, height: 630, alt: "EduSearcher — O'zbekiston o'quv markazlari xaritada" }];
