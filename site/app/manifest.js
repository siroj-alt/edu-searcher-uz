// Ilova manifesti: telefonga o'rnatilganda nomi, belgisi, ranglari va qisqa yo'llari
export default function manifest() {
  const ic = (src, size, purpose) => ({ src, sizes: `${size}x${size}`, type: 'image/png', ...(purpose ? { purpose } : {}) });
  return {
    id: '/',
    name: "EduSearcher: o'quv markazlari",
    short_name: 'EduSearcher',
    description: "O'zbekiston bo'ylab o'quv markazlari: kurs, narx va manzil bo'yicha qidiring, xaritada eng yaqinini toping va o'qishga ariza bering.",
    lang: 'uz',
    dir: 'ltr',
    start_url: '/?source=app',
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui'],
    orientation: 'portrait',
    background_color: '#F5FAF7',
    theme_color: '#0F7B55',
    categories: ['education', 'navigation'],
    prefer_related_applications: false,
    icons: [
      ic('/icons/icon-192.png', 192, 'any'),
      ic('/icons/icon-512.png', 512, 'any'),
      ic('/icons/maskable-192.png', 192, 'maskable'),
      ic('/icons/maskable-512.png', 512, 'maskable'),
      ic('/icons/monochrome-512.png', 512, 'monochrome')
    ],
    shortcuts: [
      { name: 'Markazlar', short_name: 'Markazlar', url: '/search?source=app', icons: [ic('/icons/sc-centers.png', 96)] },
      { name: 'Xarita', short_name: 'Xarita', url: '/xarita?source=app', icons: [ic('/icons/sc-map.png', 96)] },
      { name: 'Saqlanganlar', short_name: 'Saqlangan', url: '/saqlangan?source=app', icons: [ic('/icons/sc-saved.png', 96)] }
    ]
  };
}
