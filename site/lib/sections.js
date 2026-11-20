// Kurs bo'limlari: har bir bo'lim bir nechta yo'nalishni (kategoriya slug) birlashtiradi.
// Bitta yo'nalish bir nechta bo'limda bo'lishi mumkin (masalan, IELTS — tillar va imtihonlar).
export const SECTIONS = [
  { slug: 'tillar', name: 'Chet tillari', short: 'Tillar', color: '#2F6FEB', icon: 'lang',
    cats: ['english', 'ielts', 'russian', 'german', 'french', 'turkish', 'arabic', 'chinese', 'korean', 'japanese', 'uzbek-foreign'] },
  { slug: 'it', name: 'IT va dasturlash', short: 'IT', color: '#0F9D6B', icon: 'code',
    cats: ['it', 'computer', 'ai', 'cybersecurity', 'networking', 'robotics'] },
  { slug: 'bolalar', name: 'Bolalar uchun', short: 'Bolalar', color: '#F08C00', icon: 'kid',
    cats: ['preschool', 'mental', 'chess', 'robotics', 'drawing', 'english', 'math'] },
  { slug: 'fanlar', name: 'Fanlar va imtihonlar', short: 'Fanlar', color: '#7048E8', icon: 'cap',
    cats: ['math', 'physics', 'chemistry', 'biology', 'history', 'law', 'uzbek', 'sat', 'ielts'] },
  { slug: 'kasbiy', name: 'Kasbiy kurslar', short: 'Kasbiy', color: '#0B7285', icon: 'case',
    cats: ['accounting', 'marketing', 'design', 'video', 'sewing', 'cooking', 'beauty', 'computer'] },
  { slug: 'sanat', name: "San'at va ijod", short: "San'at", color: '#D6336C', icon: 'art',
    cats: ['drawing', 'music', 'dance', 'design', 'video'] }
];

export const sectionBySlug = (s) => SECTIONS.find((x) => x.slug === s) || null;

// Bo'lim belgilari (chiziqli SVG yo'llari)
export const SECTION_ICON = {
  lang: 'M4 5h9M8.5 3v2M6 5c0 4 2.5 7 6 8M11 5c-.5 3.5-3 6.5-7 8M13 21l4-10 4 10M14.5 17.5h5',
  code: 'M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14',
  kid: 'M12 7.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM12 10v5M8 12l4-2 4 2M9.5 21l2.5-6 2.5 6',
  cap: 'M2 9l10-5 10 5-10 5zM6 11v5c3 2.5 9 2.5 12 0v-5M21 9.5V15',
  case: 'M3 8h18v11H3zM8 8V5h8v3M3 13h18M11 13v2h2v-2',
  art: 'M12 3a9 9 0 1 0 0 18c1.2 0 2-.8 2-1.8 0-1-.8-1.4-.8-2.4 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3zM7.5 11.5h.01M9.5 7.5h.01M14.5 7.5h.01'
};
