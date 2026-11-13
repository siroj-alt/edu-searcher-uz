// Mavjud sayt fayllariga kiritiladigan o'zgarishlar (build paytida qo'llanadi).
// "find" — aynan mos keladigan matn, "re" — regulyar ifoda. Har biri "count" marta (odatda 1) uchrashi shart.
export default {
  delete: [
    'components/LeadForm.js',
    'components/admin/LeadsAdmin.js',
    'app/api/lead'
  ],
  patches: [
    // Umumiy qolip: yangi uslublar va pastki havola
    { file: 'app/layout.js', find: `import './v2.css';`, replace: `import './v2.css';\nimport './v3.css';\nimport './v4.css';` },
    // v4: Manrope shrifti, yorug'/qorong'u rejim (sahifa chizilishidan oldin qo'llanadi)
    { file: 'app/layout.js', find: `import { Inter } from 'next/font/google';`, replace: `import { Manrope } from 'next/font/google';\nimport { THEME_SCRIPT } from '../lib/theme';` },
    { file: 'app/layout.js', find: `const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font' });`, replace: `const inter = Manrope({ subsets: ['latin', 'cyrillic'], variable: '--font', display: 'swap' });` },
    { file: 'app/layout.js', find: `<html lang="uz" className={inter.variable}>`, replace: `<html lang="uz" className={inter.variable} data-theme="light" suppressHydrationWarning>` },
    { file: 'app/layout.js', find: `<head>`, replace: `<head>\n        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />` },
    { file: 'app/layout.js', find: `export const viewport = { themeColor: '#12B886' };`, replace: `export const viewport = { themeColor: [{ media: '(prefers-color-scheme: light)', color: '#F5FAF7' }, { media: '(prefers-color-scheme: dark)', color: '#07130E' }], colorScheme: 'light dark', viewportFit: 'cover' };` },
    { file: 'app/layout.js', find: `<li><Link href="/markazlar">Viloyatlar bo'yicha</Link></li>`, replace: `<li><Link href="/markazlar">Viloyatlar bo'yicha</Link></li>\n                  <li><Link href="/markaz-kabineti">Markazlar uchun kabinet</Link></li>` },

    // Ilova (PWA): o'rnatish taklifi, service worker, iPhone uchun sozlamalar
    { file: 'app/layout.js', find: `import Motion from '../components/Motion';`, replace: `import Motion from '../components/Motion';\nimport PwaSetup from '../components/PwaSetup';` },
    { file: 'app/layout.js', find: `<Motion />`, replace: `<Motion />\n        <PwaSetup />` },
    { file: 'app/layout.js', find: `applicationName: 'EduSearcher',`, replace: `applicationName: 'EduSearcher',\n  appleWebApp: { capable: true, title: 'EduSearcher', statusBarStyle: 'default' },` },

    // v4: oq fonlar mavzu rangiga (qorong'u rejimda ham to'g'ri ko'rinishi uchun)
    { file: 'app/globals.css', re: /background:#fff(?![0-9a-fA-F])/, replace: 'background:var(--card)', count: 15 },
    { file: 'app/extra.css', re: /background:#fff(?![0-9a-fA-F])/, replace: 'background:var(--card)', count: 1 },
    { file: 'app/v2.css', re: /background:#fff(?![0-9a-fA-F])/, replace: 'background:var(--card)', count: 5 },
    { file: 'app/motion.css', re: /background:#fff(?![0-9a-fA-F])/, replace: 'background:var(--card)', count: 2 },
    { file: 'app/__admin__/statistika/stats.css', re: /background:#fff(?![0-9a-fA-F])/, replace: 'background:var(--card)', count: 2 },
    { file: 'app/layout.js', find: `<li><Link href="/saqlangan">Saqlanganlar</Link></li>`, replace: `<li><Link href="/saqlangan">Saqlanganlar</Link></li>\n                  <li><Link href="/kabinet">Shaxsiy kabinet</Link></li>\n                  <li><Link href="/ilova">Telefon ilovasi</Link></li>` },

    // Markaz sahifasi: "sinov darsi" o'rniga o'qishga ariza
    { file: 'app/centers/[id]/page.js', find: `import LeadForm from '../../../components/LeadForm';`, replace: `import ApplyForm from '../../../components/ApplyForm';` },
    { file: 'app/centers/[id]/page.js', find: `<Cap width="18" height="18" />Sinov darsiga yozilish</a>`, replace: `<Cap width="18" height="18" />O'qishga ariza berish</a>` },
    { file: 'app/centers/[id]/page.js', find: `Aloqa ma'lumotlari hali kiritilmagan. Pastdagi forma orqali ariza qoldiring.`, replace: `Markaz bilan bog'lanish uchun pastdagi forma orqali o'qishga ariza qoldiring: markaz siz bilan o'zi bog'lanadi.` },
    { file: 'app/centers/[id]/page.js', find: `<h2>Sinov darsiga yozilish</h2>`, replace: `<h2>O'qishga ariza berish</h2>` },
    { file: 'app/centers/[id]/page.js', find: `<LeadForm centerId={c.id} centerName={c.name} options={catNames} />`, replace: `<ApplyForm centerId={c.id} centerName={c.name} courses={courseOpts} />` },
    { file: 'app/centers/[id]/page.js', find: `const minPrice = prices.length ? Math.min(...prices) : null;`, replace: `const minPrice = prices.length ? Math.min(...prices) : null;\n  const courseOpts = groupList.flatMap((g) => g.list.map((k) => ({ id: k.id, name: k.name, price: k.price_monthly || null })));` },

    // Markaz sahifasi: kursning o'z nomi (masalan "IELTS 7+ intensiv") yo'nalish nomi o'rniga ko'rinadi
    { file: 'app/centers/[id]/page.js', find: `<span>{LEVELS[k.level] || k.level}{k.duration_months`, replace: `<span>{k.name && k.name.trim() && !k.name.trim().toLowerCase().startsWith(g.cat.name.toLowerCase()) ? <><b>{k.name.trim()}</b> · </> : null}{LEVELS[k.level] || k.level}{k.duration_months` },
    { file: 'app/centers/[id]/page.js', find: `.neq('id', c.id).limit(400)`, replace: `.neq('id', c.id).limit(120)` },

    // Viloyat sahifalari matni
    { file: 'app/markazlar/[viloyat]/page.js', find: `Xaritada eng yaqin filialni toping, telefon qiling yoki sinov darsiga yoziling.`, replace: `Xaritada eng yaqin filialni toping va sayt orqali o'qishga ariza bering.` },
    { file: 'app/markazlar/[viloyat]/page.js', find: `"Sinov darsiga qanday yozilaman?"`, replace: `"O'qishga qanday ariza beraman?"` },
    { file: 'app/markazlar/[viloyat]/page.js', find: `Markaz sahifasini oching va «Sinov darsiga yozilish» formasini to'ldiring: ismingiz va telefon raqamingizni qoldirsangiz, siz bilan bog'lanamiz.`, replace: `Markaz sahifasini oching va «O'qishga ariza berish» formasini to'ldiring. Ariza markazga yetib boradi, holatini shaxsiy kabinetingizda kuzatasiz.` },
    { file: 'app/markazlar/[viloyat]/[yonalish]/page.js', find: `Xaritada eng yaqinini tanlang va sinov darsiga yoziling.`, replace: `Xaritada eng yaqinini tanlang va sayt orqali o'qishga ariza bering.` },
    { file: 'app/markazlar/[viloyat]/[yonalish]/page.js', find: `o'zingizga eng yaqinini tanlang va bepul sinov darsiga yoziling.`, replace: `o'zingizga eng yaqinini tanlang va sayt orqali o'qishga ariza bering.` },
    { file: 'app/markazlar/[viloyat]/[yonalish]/page.js', find: `Aniq narxni markaz sahifasidagi telefon orqali yoki sinov darsiga yozilib bilib olishingiz mumkin.`, replace: `Aniq narxni markaz sahifasida ko'rishingiz yoki o'qishga ariza qoldirib bilib olishingiz mumkin.` },


    // Qidiruv: yo'nalishlar qatori gorizontal aylanadi
    { file: 'app/search/page.js', re: /<div className="chips">(\s*)\{cats\.map\(/, replace: `<div className="chips scroll">$1{cats.map(` },

    { file: 'app/robots.js', find: `disallow: ['/api/', '/saqlangan']`, replace: `disallow: ['/api/', '/saqlangan', '/kabinet', '/kirish', '/markaz-kabineti']` },
    { file: 'app/saqlangan/page.js', find: `Ro'yxat faqat shu qurilmada saqlanadi.`, replace: `Saqlangan markazlar shaxsiy kabinetingizda turadi va barcha qurilmalaringizda ko'rinadi.` },
    // Saqlash faqat kabinetga kirgan foydalanuvchi uchun
    { file: 'app/saqlangan/page.js', find: `import SavedList from '../../components/SavedList';`, replace: `import SavedGate from '../../components/SavedGate';` },
    { file: 'app/saqlangan/page.js', find: `<SavedList />`, replace: `<SavedGate />` },

    // Admin panel: aloqa ma'lumotlari va markaz kabineti alohida blokda, foydalanuvchilar bo'limi
    { file: 'components/AdminPanel.js', find: `import CenterManager from './CenterManager';`, replace: `import CenterManager from './CenterManager';\nimport CenterAccess from './admin/CenterAccess';\nimport UsersAdmin from './admin/UsersAdmin';` },
    { file: 'components/AdminPanel.js', re: /name: f\.name, description: nz\(f\.description\), phone: nz\(f\.phone\), website: nz\(f\.website\),\s*telegram: nz\(f\.telegram\), instagram: nz\(f\.instagram\),(\s*)rating:/, replace: `name: f.name, description: nz(f.description),$1rating:` },
    { file: 'components/AdminPanel.js', re: /\s*<div className="two">\s*<label>Asosiy telefon<input name="phone" defaultValue[\s\S]*?<label>Instagram<input name="instagram" defaultValue[^\n]*<\/label>\s*<\/div>/, replace: `` },
    { file: 'components/AdminPanel.js', find: `<div style={{ marginTop: 20 }}><CenterManager centerId={c.id} onMsg={setMsg} /></div>`, replace: `<CenterAccess center={c} onMsg={setMsg} onChange={load} />\n                  <div style={{ marginTop: 20 }}><CenterManager centerId={c.id} onMsg={setMsg} /></div>` },
    { file: 'components/AdminPanel.js', find: `<div className="sec" style={{ flex: 1 }}><h2>Admin panel</h2><i /></div>`, replace: `<div className="adm-head" style={{ flex: 1 }}><h1>Asosiy panel</h1><p>Umumiy ko'rsatkichlar, markazlarni qo'shish va tahrirlash, sayt foydalanuvchilari va adminlar shu yerda.</p></div>` },
    { file: 'components/AdminPanel.js', find: `[['stats', 'Umumiy'], ['centers', 'Markazlar'], ['admins', 'Adminlar']]`, replace: `[['stats', 'Umumiy'], ['centers', 'Markazlar'], ['users', 'Foydalanuvchilar'], ['admins', 'Adminlar']]` },
    { file: 'components/AdminPanel.js', find: `{tab === 'admins' && (`, replace: `{tab === 'users' && <UsersAdmin onMsg={setMsg} />}\n\n      {tab === 'admins' && (` },

    // Admin ro'yxati: PostgREST bir so'rovda 1000 qatordan ortiq bermaydi, shuning uchun markazlar sahifalab yuklanadi
    { file: 'components/AdminPanel.js', find: `const nz = (v) => (v && v.trim() ? v.trim() : null);`, replace: `const nz = (v) => (v && v.trim() ? v.trim() : null);\nconst fetchAllCenters = async () => {\n  const all = [];\n  let error = null;\n  for (let from = 0; from < 50000; from += 1000) {\n    const r = await supabase.from('centers').select('*').order('created_at', { ascending: false }).order('id').range(from, from + 999);\n    if (r.error) { error = r.error; break; }\n    const rows = r.data || [];\n    all.push(...rows);\n    if (rows.length < 1000) break;\n  }\n  return { data: all, error };\n};` },
    { file: 'components/AdminPanel.js', find: `supabase.from('centers').select('*').order('created_at', { ascending: false }).limit(2000),`, replace: `fetchAllCenters(),` },

    // Kurs/narx o'zgargach sahifada eski ma'lumot qolmasligi uchun: Next.js server keshi o'rniga har so'rov yangi ma'lumot oladi
    { file: 'lib/supabase.js', find: `export const supabase = createClient(url, key);`, replace: `const noStoreFetch = (input, init) => fetch(input, { ...(init || {}), cache: 'no-store' });\n\nexport const supabase = createClient(url, key, { global: { fetch: noStoreFetch } });` },

    { file: 'app/__admin__/page.js', find: `<div className="lock" aria-hidden="true">🔒</div>`, replace: `<div className="lock" aria-hidden="true"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="10" width="16" height="11" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg></div>` },
    { file: 'app/__admin__/tavsiya/page.js', find: `title: 'Tavsiya va belgilar | EduSearcher'`, replace: `title: 'Belgilar va kontaktlar | EduSearcher'` },

    // Filial telefonlari yashirilgan paytda ham boshqaruvda ko'rinadi
    { file: 'components/CenterManager.js', re: /setD\(data\);(\s*)\}, \[centerId\]\);/, replace: `const { data: bp } = await supabase.from('branch_contacts').select('branch_id,phone').eq('center_id', centerId);\n    const ph = Object.fromEntries((bp || []).map((x) => [x.branch_id, x.phone]));\n    if (data) data.branches = (data.branches || []).map((b) => ({ ...b, phone: ph[b.id] ?? b.phone }));\n    setD(data);$1}, [centerId]);` },

    // v5: markaz rasmlari (bir nechta rasm, asosiy rasm kartalarda va kurslar ro'yxatida)
    { file: "lib/points.js", find: "is_featured,created_at,updated_at,branches(id,address,lat,lng,region_id)", replace: "is_featured,created_at,updated_at,cover_url,branches(id,address,lat,lng,region_id)" },
    { file: "components/SavedList.js", find: "'id,name,rating,phone,website,is_verified,is_featured,branches(", replace: "'id,name,rating,phone,website,is_verified,is_featured,cover_url,branches(" },
    { file: "app/centers/[id]/page.js", find: "is_featured,updated_at,created_at,' +", replace: "is_featured,updated_at,created_at,cover_url,center_photos(id,url,thumb_url,is_cover,sort),' +" },
    { file: "app/centers/[id]/page.js", find: "'id,name,rating,phone,website,is_verified,is_featured,branches!inner(", replace: "'id,name,rating,phone,website,is_verified,is_featured,cover_url,branches!inner(" },
    { file: "app/centers/[id]/page.js", find: "import ReviewForm from '../../../components/ReviewForm';", replace: "import ReviewForm from '../../../components/ReviewForm';\nimport CenterGallery from '../../../components/CenterGallery';" },
    { file: "app/centers/[id]/page.js", re: /(<section className="card">\s*<div className="chead">)/, replace: "<CenterGallery photos={c.center_photos || []} name={c.name} />\n      $1" },
    { file: "app/centers/[id]/page.js", find: "<div className=\"av lg\" style={{ background: color }}>{initials(c.name)}</div>", replace: "{c.cover_url ? <img className=\"av lg pic\" src={c.cover_url} alt=\"\" /> : <div className=\"av lg\" style={{ background: color }}>{initials(c.name)}</div>}" },
    { file: "app/search/page.js", find: "const featured = new Set((featData || []).map((x) => x.id));", replace: "const featured = new Set((featData || []).map((x) => x.id));\n  const covIds = [...new Set(rows.map((r) => r.center_id))].slice(0, 150);\n  const { data: covData } = covIds.length ? await supabase.from('centers').select('id,cover_url').in('id', covIds).not('cover_url', 'is', null) : { data: [] };\n  const covers = Object.fromEntries((covData || []).map((x) => [x.id, x.cover_url]));" },
    { file: "app/search/page.js", find: "{isBest && <span className=\"bestb\">Eng mos natija</span>}", replace: "{covers[r.center_id] ? <Link href={\"/centers/\" + r.center_id} className=\"rcov\" tabIndex={-1} aria-hidden=\"true\"><img src={covers[r.center_id]} alt=\"\" loading=\"lazy\" decoding=\"async\" /></Link> : null}\n                  {isBest && <span className=\"bestb\">Eng mos natija</span>}" },
    { file: "components/AdminPanel.js", find: "import UsersAdmin from './admin/UsersAdmin';", replace: "import UsersAdmin from './admin/UsersAdmin';\nimport CenterPhotos from './shared/CenterPhotos';" },
    { file: "components/AdminPanel.js", find: "<CenterAccess center={c} onMsg={setMsg} onChange={load} />", replace: "<CenterPhotos centerId={c.id} onMsg={setMsg} />\n                  <CenterAccess center={c} onMsg={setMsg} onChange={load} />" }

  ]
};
