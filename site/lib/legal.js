// Tashkiliy-huquqiy shakllar (markaz ro'yxatdan o'tishi va kabinet uchun)
export const ORG_FORMS = [
  ['MChJ', "MChJ — mas'uliyati cheklangan jamiyat"],
  ['NTM', "NTM — nodavlat ta'lim muassasasi"],
  ['YaTT', 'YaTT — yakka tartibdagi tadbirkor'],
  ['XK', 'XK — xususiy korxona'],
  ['AJ', 'AJ — aksiyadorlik jamiyati'],
  ['DM', 'DM — davlat muassasasi'],
  ['Boshqa', 'Boshqa']
];
export const onlyDigits = (v) => String(v || '').replace(/\D/g, '');
export const fmtInn = (v) => onlyDigits(v).slice(0, 9).replace(/^(\d{3})(\d{0,3})(\d{0,3}).*$/, (m, a, b, c) => [a, b, c].filter(Boolean).join(' '));
