export const CAT_COLORS = {
  english: '#FF6B6B', ielts: '#7950F2', it: '#12B886', math: '#F59F00', russian: '#228BE6', chinese: '#E64980', korean: '#1098AD',
  german: '#495057', arabic: '#2B8A3E', sat: '#D6336C',
  chemistry: '#AE3EC9', biology: '#37B24D', history: '#D9480F', law: '#364FC7', physics: '#0B7285', uzbek: '#E8590C',
  cybersecurity: '#C92A2A', ai: '#6741D9', networking: '#1971C2', video: '#F76707', design: '#F06595', marketing: '#FAB005',
  robotics: '#5C7CFA', accounting: '#087F5B', mental: '#FF922B', turkish: '#E03131', japanese: '#BE4BDB', french: '#4263EB', computer: '#868E96'
};
export const CAT_GLYPH = {
  english: 'Aa', ielts: '7.5', it: '</>', math: '∑', russian: 'Яя', chinese: '中', korean: '한', german: 'De', arabic: 'ع', sat: 'SAT',
  chemistry: 'H₂O', biology: 'Bio', history: 'XIV', law: '§', physics: 'Ω', uzbek: 'Ona',
  cybersecurity: '0x', ai: 'AI', networking: 'IP', video: 'REC', design: 'UI', marketing: '@',
  robotics: 'Bot', accounting: '%', mental: '1+1', turkish: 'Tr', japanese: '日', french: 'Fr', computer: 'PC'
};
export const colorFor = (s) => CAT_COLORS[s] || '#0F2A1F';
export const initials = (n) => (n || '').replace(/[^\p{L}\p{N} ]/gu, '').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'E';
export const tel = (p) => 'tel:' + p.replace(/[^\d+]/g, '');
export const url = (u) => (/^https?:\/\//i.test(u) ? u : 'https://' + u);
export const host = (u) => u.replace(/^https?:\/\//i, '').replace(/\/$/, '');
export const fmtKm = (k) => (k < 1 ? Math.round(k * 1000) + ' m' : k.toFixed(1) + ' km');
