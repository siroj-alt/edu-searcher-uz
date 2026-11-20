// Mavjud sayt fayllariga kiritiladigan o'zgarishlar (build paytida qo'llanadi).
// "find" — aynan mos keladigan matn, "re" — regulyar ifoda. Har biri "count" marta (odatda 1) uchrashi shart.
export default {
  delete: [
    'components/LeadForm.js',
    'components/admin/LeadsAdmin.js',
    'app/api/lead'
  ],
  patches: [
    // Har bir build uchun noyob raqam (eski ochiq sahifalarni yangilash uchun)
    { file: 'next.config.js', find: `module.exports = {`, replace: `module.exports = {\n  env: { ES_BUILD: process.env.VERCEL_DEPLOYMENT_ID || process.env.VERCEL_URL || String(Date.now()) },` },
    // Umumiy qolip: yangi uslublar va pastki havola
    { file: 'app/layout.js', find: `import './v2.css';`, replace: `import './v2.css';\nimport './v3.css';\nimport './v4.css';\nimport './v5.css';\nimport './v6.css';\nimport './v7.css';` },
    // v4: Manrope shrifti, yorug'/qorong'u rejim (sahifa chizilishidan oldin qo'llanadi)
    { file: 'app/layout.js', find: `import { Inter } from 'next/font/google';`, replace: `import { Manrope } from 'next/font/google';\nimport { THEME_SCRIPT } from '../lib/theme';\nimport { LANG_SCRIPT } from '../lib/i18n';` },
    { file: 'app/layout.js', find: `const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font' });`, replace: `const inter = Manrope({ subsets: ['latin', 'cyrillic'], variable: '--font', display: 'swap' });` },
    { file: 'app/layout.js', find: `<html lang="uz" className={inter.variable}>`, replace: `<html lang="uz" className={inter.variable} data-theme="light" suppressHydrationWarning>` },
    { file: 'app/layout.js', find: `<head>`, replace: `<head>\n        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />\n        <script dangerouslySetInnerHTML={{ __html: LANG_SCRIPT }} />` },
    { file: 'app/layout.js', find: `export const viewport = { themeColor: '#12B886' };`, replace: `export const viewport = { themeColor: '#F5FAF7', colorScheme: 'light', viewportFit: 'cover' };` },
    { file: 'app/layout.js', find: `<li><Link href="/markazlar">Viloyatlar bo'yicha</Link></li>`, replace: `<li><Link href="/markazlar">Viloyatlar bo'yicha</Link></li>\n                  <li><Link href="/markaz-royxat">Markazni qo'shish</Link></li>\n                  <li><Link href="/markaz-kabineti">Markazlar uchun kabinet</Link></li>` },

    // Ilova (PWA): o'rnatish taklifi, service worker, iPhone uchun sozlamalar
    { file: 'app/layout.js', find: `import Motion from '../components/Motion';`, replace: `import Motion from '../components/Motion';\nimport PwaSetup from '../components/PwaSetup';\nimport CompareBar from '../components/CompareBar';\nimport Toast from '../components/Toast';\nimport Translator from '../components/Translator';\nimport UpdateCheck from '../components/UpdateCheck';` },
    { file: 'app/layout.js', find: `<Motion />`, replace: `<Motion />\n        <PwaSetup />\n        <CompareBar />\n        <Toast />\n        <Translator />\n        <UpdateCheck />` },
    { file: 'app/layout.js', find: `applicationName: 'EduSearcher',`, replace: `applicationName: 'EduSearcher',\n  appleWebApp: { capable: true, title: 'EduSearcher', statusBarStyle: 'default' },` },

    // v4: oq fonlar mavzu rangiga (qorong'u rejimda ham to'g'ri ko'rinishi uchun)
    { file: 'app/globals.css', re: /background:#fff(?![0-9a-fA-F])/, replace: 'background:var(--card)', count: 15 },
    { file: 'app/extra.css', re: /background:#fff(?![0-9a-fA-F])/, replace: 'background:var(--card)', count: 1 },
    { file: 'app/v2.css', re: /background:#fff(?![0-9a-fA-F])/, replace: 'background:var(--card)', count: 5 },
    { file: 'app/motion.css', re: /background:#fff(?![0-9a-fA-F])/, replace: 'background:var(--card)', count: 2 },
    { file: 'app/__admin__/statistika/stats.css', re: /background:#fff(?![0-9a-fA-F])/, replace: 'background:var(--card)', count: 2 },
    { file: 'app/layout.js', find: `<li><Link href="/saqlangan">Saqlanganlar</Link></li>`, replace: `<li><Link href="/saqlangan">Saqlanganlar</Link></li>\n                  <li><Link href="/kabinet">Shaxsiy kabinet</Link></li>\n                  <li><Link href="/ilova">Telefon ilovasi</Link></li>` },

    // Markaz sahifasi: "sinov darsi" o'rniga o'qishga ariza

    // Markaz sahifasi: kursning o'z nomi (masalan "IELTS 7+ intensiv") yo'nalish nomi o'rniga ko'rinadi

    // Viloyat sahifalari matni
    { file: 'app/markazlar/[viloyat]/page.js', find: `Xaritada eng yaqin filialni toping, telefon qiling yoki sinov darsiga yoziling.`, replace: `Xaritada eng yaqin filialni toping va sayt orqali o'qishga ariza bering.` },
    { file: 'app/markazlar/[viloyat]/page.js', find: `"Sinov darsiga qanday yozilaman?"`, replace: `"O'qishga qanday ariza beraman?"` },
    { file: 'app/markazlar/[viloyat]/page.js', find: `Markaz sahifasini oching va «Sinov darsiga yozilish» formasini to'ldiring: ismingiz va telefon raqamingizni qoldirsangiz, siz bilan bog'lanamiz.`, replace: `Markaz sahifasini oching va «O'qishga ariza berish» formasini to'ldiring. Ariza markazga yetib boradi, holatini shaxsiy kabinetingizda kuzatasiz.` },
    { file: 'app/markazlar/[viloyat]/[yonalish]/page.js', find: `Xaritada eng yaqinini tanlang va sinov darsiga yoziling.`, replace: `Xaritada eng yaqinini tanlang va sayt orqali o'qishga ariza bering.` },
    { file: 'app/markazlar/[viloyat]/[yonalish]/page.js', find: `o'zingizga eng yaqinini tanlang va bepul sinov darsiga yoziling.`, replace: `o'zingizga eng yaqinini tanlang va sayt orqali o'qishga ariza bering.` },
    { file: 'app/markazlar/[viloyat]/[yonalish]/page.js', find: `Aniq narxni markaz sahifasidagi telefon orqali yoki sinov darsiga yozilib bilib olishingiz mumkin.`, replace: `Aniq narxni markaz sahifasida ko'rishingiz yoki o'qishga ariza qoldirib bilib olishingiz mumkin.` },


    // Qidiruv: yo'nalishlar qatori gorizontal aylanadi

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
    { file: 'lib/supabase.js', find: `export const supabase = createClient(url, key);`, replace: `const noStoreFetch = (input, init) => fetch(input, { ...(init || {}), cache: 'no-store' });\n\nexport const supabase = createClient(url, key, { global: { fetch: noStoreFetch }, auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true, autoRefreshToken: true } });` },

    { file: 'app/__admin__/page.js', find: `<div className="lock" aria-hidden="true">🔒</div>`, replace: `<div className="lock" aria-hidden="true"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="10" width="16" height="11" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg></div>` },
    { file: 'app/__admin__/tavsiya/page.js', find: `title: 'Tavsiya va belgilar | EduSearcher'`, replace: `title: 'Belgilar va kontaktlar | EduSearcher'` },

    // Filial telefonlari yashirilgan paytda ham boshqaruvda ko'rinadi
    { file: 'components/CenterManager.js', re: /setD\(data\);(\s*)\}, \[centerId\]\);/, replace: `const { data: bp } = await supabase.from('branch_contacts').select('branch_id,phone').eq('center_id', centerId);\n    const ph = Object.fromEntries((bp || []).map((x) => [x.branch_id, x.phone]));\n    if (data) data.branches = (data.branches || []).map((b) => ({ ...b, phone: ph[b.id] ?? b.phone }));\n    setD(data);$1}, [centerId]);` },

    // v5: markaz rasmlari (bir nechta rasm, asosiy rasm kartalarda va kurslar ro'yxatida)
    { file: "components/SavedList.js", find: "'id,name,rating,phone,website,is_verified,is_featured,branches(", replace: "'id,name,rating,phone,website,is_verified,is_featured,cover_url,branches(" },
    { file: "components/AdminPanel.js", find: "import UsersAdmin from './admin/UsersAdmin';", replace: "import UsersAdmin from './admin/UsersAdmin';\nimport CenterPhotos from './shared/CenterPhotos';" },
    { file: "components/AdminPanel.js", find: "<CenterAccess center={c} onMsg={setMsg} onChange={load} />", replace: "<CenterPhotos centerId={c.id} onMsg={setMsg} />\n                  <CenterAccess center={c} onMsg={setMsg} onChange={load} />" },

    // v12: yangi uslublar, manba (UTM) va Metrika, qidiruv tizimlari teglari, pastki havolalar
    { file: 'app/layout.js', find: `import './v7.css';`, replace: `import './v7.css';\nimport './v8.css';` },
    { file: 'app/layout.js', find: `import UpdateCheck from '../components/UpdateCheck';`, replace: `import UpdateCheck from '../components/UpdateCheck';\nimport SourceCapture from '../components/SourceCapture';\nimport SiteMeta from '../components/SiteMeta';` },
    { file: 'app/layout.js', find: `<UpdateCheck />`, replace: `<UpdateCheck />\n        <SourceCapture />` },
    { file: 'app/layout.js', find: `<script dangerouslySetInnerHTML={{ __html: LANG_SCRIPT }} />`, replace: `<script dangerouslySetInnerHTML={{ __html: LANG_SCRIPT }} />\n        <SiteMeta />` },
    { file: 'app/layout.js', find: `<li><Link href="/markaz-kabineti">Markazlar uchun kabinet</Link></li>`, replace: `<li><Link href="/markaz-kabineti">Markazlar uchun kabinet</Link></li>\n                  <li><Link href="/hamkorlik">Hamkorlik shartlari</Link></li>\n                  <li><Link href="/narxlar">Kurs narxlari indeksi</Link></li>` }

  ]
};
