// Daraja testlari. Savollar osondan qiyinga qarab; natija CEFR darajasi (ingliz tili)
// yoki boshlang'ich / o'rta / yuqori (matematika). Natijaga qarab mos markazlar tavsiya qilinadi.

export const TESTS = {
  english: {
    slug: 'english',
    title: { uz: 'Ingliz tili', ru: 'Английский язык' },
    sub: { uz: '15 savol, ~4 daqiqa. Darajangiz CEFR bo\'yicha (A1–C1).', ru: '15 вопросов, ~4 минуты. Уровень по CEFR (A1–C1).' },
    color: '#FF6B6B',
    glyph: 'Aa',
    cats: ['english', 'ielts'],
    q: [
      { lv: 'A1', q: 'She ___ a teacher.', o: ['is', 'are', 'am', 'be'], a: 0 },
      { lv: 'A1', q: 'I ___ to school every day.', o: ['goes', 'go', 'going', 'gone'], a: 1 },
      { lv: 'A1', q: 'There ___ two books on the table.', o: ['is', 'be', 'are', 'am'], a: 2 },
      { lv: 'A2', q: 'Yesterday we ___ a great film.', o: ['see', 'have seen', 'saw', 'seeing'], a: 2 },
      { lv: 'A2', q: 'This bag is ___ than that one.', o: ['more cheap', 'cheaper', 'cheapest', 'most cheap'], a: 1 },
      { lv: 'A2', q: 'Have you ever ___ to London?', o: ['go', 'went', 'been', 'going'], a: 2 },
      { lv: 'B1', q: 'If it rains tomorrow, we ___ at home.', o: ['stay', 'will stay', 'would stay', 'stayed'], a: 1 },
      { lv: 'B1', q: 'I\'ve been learning English ___ three years.', o: ['since', 'during', 'for', 'from'], a: 2 },
      { lv: 'B1', q: 'The book ___ by millions of people.', o: ['has read', 'has been read', 'is reading', 'read'], a: 1 },
      { lv: 'B2', q: 'If I ___ more time, I would travel more.', o: ['have', 'had', 'will have', 'would have'], a: 1 },
      { lv: 'B2', q: 'She suggested ___ a taxi.', o: ['to take', 'take', 'taking', 'took'], a: 2 },
      { lv: 'B2', q: 'He apologised ___ being late.', o: ['for', 'about', 'of', 'to'], a: 0 },
      { lv: 'C1', q: 'Hardly ___ the room when the phone rang.', o: ['I had entered', 'had I entered', 'I entered', 'did I entered'], a: 1 },
      { lv: 'C1', q: 'The results were ___ with our expectations.', o: ['consistent', 'constant', 'consequent', 'considerate'], a: 0 },
      { lv: 'C1', q: 'Had she known the truth, she ___ differently.', o: ['will act', 'would act', 'would have acted', 'acted'], a: 2 }
    ]
  },
  math: {
    slug: 'math',
    title: { uz: 'Matematika', ru: 'Математика' },
    sub: { uz: '12 savol, ~6 daqiqa. Boshlang\'ich, o\'rta yoki yuqori daraja.', ru: '12 вопросов, ~6 минут. Начальный, средний или высокий уровень.' },
    color: '#F59F00',
    glyph: '∑',
    cats: ['math'],
    q: [
      { lv: 'beginner', q: '25 + 37 = ?', o: ['52', '62', '63', '72'], a: 1 },
      { lv: 'beginner', q: '8 × 7 = ?', o: ['54', '56', '58', '64'], a: 1 },
      { lv: 'beginner', q: '144 : 12 = ?', o: ['11', '12', '13', '14'], a: 1 },
      { lv: 'beginner', q: '3/4 = ?', o: ['0,34', '0,7', '0,75', '1,33'], a: 2 },
      { lv: 'intermediate', q: '2x + 5 = 17. x = ?', o: ['5', '6', '7', '11'], a: 1 },
      { lv: 'intermediate', q: '200 ning 15% i nechaga teng?', o: ['15', '20', '30', '35'], a: 2 },
      { lv: 'intermediate', q: 'To\'g\'ri burchakli uchburchakda katetlar 6 va 8. Gipotenuza = ?', o: ['10', '12', '14', '48'], a: 0 },
      { lv: 'intermediate', q: '(a + b)² = ?', o: ['a² + b²', 'a² + 2ab + b²', 'a² − 2ab + b²', '2a + 2b'], a: 1 },
      { lv: 'advanced', q: 'x² − 5x + 6 = 0 tenglamaning ildizlari:', o: ['1 va 6', '2 va 3', '−2 va −3', '−1 va 6'], a: 1 },
      { lv: 'advanced', q: 'log₂ 32 = ?', o: ['4', '5', '6', '16'], a: 1 },
      { lv: 'advanced', q: 'sin 30° = ?', o: ['1/2', '√2/2', '√3/2', '1'], a: 0 },
      { lv: 'advanced', q: 'f(x) = x³ bo\'lsa, f\'(x) = ?', o: ['3x', 'x²', '3x²', 'x³/3'], a: 2 }
    ]
  }
};

// Ruscha matematik savollar matni (variantlar bir xil)
const MATH_RU = {
  '200 ning 15% i nechaga teng?': 'Сколько составляет 15% от 200?',
  'To\'g\'ri burchakli uchburchakda katetlar 6 va 8. Gipotenuza = ?': 'Катеты прямоугольного треугольника 6 и 8. Гипотенуза = ?',
  'x² − 5x + 6 = 0 tenglamaning ildizlari:': 'Корни уравнения x² − 5x + 6 = 0:',
  'f(x) = x³ bo\'lsa, f\'(x) = ?': 'Если f(x) = x³, то f\'(x) = ?'
};
export const qText = (q, lang) => (lang === 'ru' && MATH_RU[q.q]) || q.q;
export const optText = (o, lang) => (lang === 'ru' ? o.replace(/ va /g, ' и ') : o);

// Natijani hisoblash
export function grade(testKey, answers) {
  const t = TESTS[testKey];
  const right = t.q.map((q, i) => answers[i] === q.a);
  const score = right.filter(Boolean).length;
  if (testKey === 'english') {
    // Har darajada kamida 2 ta to'g'ri javob — keyingi darajaga o'tadi
    const order = ['A1', 'A2', 'B1', 'B2', 'C1'];
    let lvl = 'A0';
    for (const L of order) {
      const qs = t.q.map((q, i) => ({ q, i })).filter((x) => x.q.lv === L);
      if (qs.filter((x) => right[x.i]).length >= 2) lvl = L; else break;
    }
    const level = lvl === 'A0' || lvl === 'A1' || lvl === 'A2' ? 'beginner' : lvl === 'C1' ? 'advanced' : 'intermediate';
    return { score, total: t.q.length, label: lvl === 'A0' ? 'A1' : lvl, cefr: lvl, level };
  }
  const order = ['beginner', 'intermediate', 'advanced'];
  let lvl = null;
  for (const L of order) {
    const qs = t.q.map((q, i) => ({ q, i })).filter((x) => x.q.lv === L);
    if (qs.filter((x) => right[x.i]).length >= 3) lvl = L; else break;
  }
  return { score, total: t.q.length, label: lvl || 'beginner', level: lvl || 'beginner' };
}
