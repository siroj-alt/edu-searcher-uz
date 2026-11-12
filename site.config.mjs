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
    { file: 'app/layout.js', find: `import './v2.css';`, replace: `import './v2.css';\nimport './v3.css';` },
    { file: 'app/layout.js', find: `<li><Link href="/saqlangan">Saqlanganlar</Link></li>`, replace: `<li><Link href="/saqlangan">Saqlanganlar</Link></li>\n                  <li><Link href="/kabinet">Shaxsiy kabinet</Link></li>` },

    // Markaz sahifasi: "sinov darsi" o'rniga o'qishga ariza
    { file: 'app/centers/[id]/page.js', find: `import LeadForm from '../../../components/LeadForm';`, replace: `import ApplyForm from '../../../components/ApplyForm';` },
    { file: 'app/centers/[id]/page.js', find: `<Cap width="18" height="18" />Sinov darsiga yozilish</a>`, replace: `<Cap width="18" height="18" />O'qishga ariza berish</a>` },
    { file: 'app/centers/[id]/page.js', find: `Aloqa ma'lumotlari hali kiritilmagan. Pastdagi forma orqali ariza qoldiring.`, replace: `Markaz bilan bog'lanish uchun pastdagi forma orqali o'qishga ariza qoldiring: markaz siz bilan o'zi bog'lanadi.` },
    { file: 'app/centers/[id]/page.js', find: `<h2>Sinov darsiga yozilish</h2>`, replace: `<h2>O'qishga ariza berish</h2>` },
    { file: 'app/centers/[id]/page.js', find: `<LeadForm centerId={c.id} centerName={c.name} options={catNames} />`, replace: `<ApplyForm centerId={c.id} centerName={c.name} courses={courseOpts} />` },
    { file: 'app/centers/[id]/page.js', find: `const minPrice = prices.length ? Math.min(...prices) : null;`, replace: `const minPrice = prices.length ? Math.min(...prices) : null;\n  const courseOpts = groupList.flatMap((g) => g.list.map((k) => ({ id: k.id, name: k.name, price: k.price_monthly || null })));` },

    // Viloyat sahifalari matni
    { file: 'app/markazlar/[viloyat]/page.js', find: `Xaritada eng yaqin filialni toping, telefon qiling yoki sinov darsiga yoziling.`, replace: `Xaritada eng yaqin filialni toping va sayt orqali o'qishga ariza bering.` },
    { file: 'app/markazlar/[viloyat]/page.js', find: `"Sinov darsiga qanday yozilaman?"`, replace: `"O'qishga qanday ariza beraman?"` },
    { file: 'app/markazlar/[viloyat]/page.js', find: `Markaz sahifasini oching va «Sinov darsiga yozilish» formasini to'ldiring: ismingiz va telefon raqamingizni qoldirsangiz, siz bilan bog'lanamiz.`, replace: `Markaz sahifasini oching va «O'qishga ariza berish» formasini to'ldiring. Ariza markazga yetib boradi, holatini shaxsiy kabinetingizda kuzatasiz.` },
    { file: 'app/markazlar/[viloyat]/[yonalish]/page.js', find: `Xaritada eng yaqinini tanlang va sinov darsiga yoziling.`, replace: `Xaritada eng yaqinini tanlang va sayt orqali o'qishga ariza bering.` },
    { file: 'app/markazlar/[viloyat]/[yonalish]/page.js', find: `o'zingizga eng yaqinini tanlang va bepul sinov darsiga yoziling.`, replace: `o'zingizga eng yaqinini tanlang va sayt orqali o'qishga ariza bering.` },
    { file: 'app/markazlar/[viloyat]/[yonalish]/page.js', find: `Aniq narxni markaz sahifasidagi telefon orqali yoki sinov darsiga yozilib bilib olishingiz mumkin.`, replace: `Aniq narxni markaz sahifasida ko'rishingiz yoki o'qishga ariza qoldirib bilib olishingiz mumkin.` },

    // Bosh sahifa: yo'nalishlar ko'paygani uchun
    { file: 'app/page.js', find: `"Ingliz tili, IELTS, IT, matematika yoki boshqa tillar: istalgan viloyatda."`, replace: `"Tillar, IT, aniq va tabiiy fanlar, kasbiy kurslar: istalgan viloyatda."` },
    { file: 'app/page.js', re: /<div className="legend">(\s*)\{cats\.map\(\(c\) =>/, replace: `<div className="legend">$1{[...cats].filter((c) => catCount[c.slug]).sort((a, b) => catCount[b.slug] - catCount[a.slug]).slice(0, 8).map((c) =>` },
    { file: 'app/page.js', re: /\{cats\.map\(\(c, i\) => \((\s*)<Link key=\{c\.id\} className="cat"/, replace: `{cats.filter((c) => catCount[c.slug]).map((c, i) => ($1<Link key={c.id} className="cat"` },

    // Qidiruv: yo'nalishlar qatori gorizontal aylanadi
    { file: 'app/search/page.js', re: /<div className="chips">(\s*)\{cats\.map\(/, replace: `<div className="chips scroll">$1{cats.map(` },

    { file: 'app/robots.js', find: `disallow: ['/api/', '/saqlangan']`, replace: `disallow: ['/api/', '/saqlangan', '/kabinet', '/kirish', '/markaz-kabineti']` },
    { file: 'app/saqlangan/page.js', find: `Ro'yxat faqat shu qurilmada saqlanadi.`, replace: `Kabinetingizga kirsangiz, ro'yxat barcha qurilmalaringizda saqlanadi.` },

    // Admin panel: aloqa ma'lumotlari va markaz kabineti alohida blokda, foydalanuvchilar bo'limi
    { file: 'components/AdminPanel.js', find: `import CenterManager from './CenterManager';`, replace: `import CenterManager from './CenterManager';\nimport CenterAccess from './admin/CenterAccess';\nimport UsersAdmin from './admin/UsersAdmin';` },
    { file: 'components/AdminPanel.js', re: /name: f\.name, description: nz\(f\.description\), phone: nz\(f\.phone\), website: nz\(f\.website\),\s*telegram: nz\(f\.telegram\), instagram: nz\(f\.instagram\),(\s*)rating:/, replace: `name: f.name, description: nz(f.description),$1rating:` },
    { file: 'components/AdminPanel.js', re: /\s*<div className="two">\s*<label>Asosiy telefon<input name="phone" defaultValue[\s\S]*?<label>Instagram<input name="instagram" defaultValue[^\n]*<\/label>\s*<\/div>/, replace: `` },
    { file: 'components/AdminPanel.js', find: `<div style={{ marginTop: 20 }}><CenterManager centerId={c.id} onMsg={setMsg} /></div>`, replace: `<CenterAccess center={c} onMsg={setMsg} onChange={load} />\n                  <div style={{ marginTop: 20 }}><CenterManager centerId={c.id} onMsg={setMsg} /></div>` },
    { file: 'components/AdminPanel.js', find: `[['stats', 'Umumiy'], ['centers', 'Markazlar'], ['admins', 'Adminlar']]`, replace: `[['stats', 'Umumiy'], ['centers', 'Markazlar'], ['users', 'Foydalanuvchilar'], ['admins', 'Adminlar']]` },
    { file: 'components/AdminPanel.js', find: `{tab === 'admins' && (`, replace: `{tab === 'users' && <UsersAdmin onMsg={setMsg} />}\n\n      {tab === 'admins' && (` },

    // Admin ro'yxati: PostgREST bir so'rovda 1000 qatordan ortiq bermaydi, shuning uchun markazlar sahifalab yuklanadi
    { file: 'components/AdminPanel.js', find: `const nz = (v) => (v && v.trim() ? v.trim() : null);`, replace: `const nz = (v) => (v && v.trim() ? v.trim() : null);\nconst fetchAllCenters = async () => {\n  const all = [];\n  let error = null;\n  for (let from = 0; from < 50000; from += 1000) {\n    const r = await supabase.from('centers').select('*').order('created_at', { ascending: false }).order('id').range(from, from + 999);\n    if (r.error) { error = r.error; break; }\n    const rows = r.data || [];\n    all.push(...rows);\n    if (rows.length < 1000) break;\n  }\n  return { data: all, error };\n};` },
    { file: 'components/AdminPanel.js', find: `supabase.from('centers').select('*').order('created_at', { ascending: false }).limit(2000),`, replace: `fetchAllCenters(),` },

    // Kurs/narx o'zgargach sahifada eski ma'lumot qolmasligi uchun: Next.js server keshi o'rniga har so'rov yangi ma'lumot oladi
    { file: 'lib/supabase.js', find: `export const supabase = createClient(url, key);`, replace: `const noStoreFetch = (input, init) => fetch(input, { ...(init || {}), cache: 'no-store' });\n\nexport const supabase = createClient(url, key, { global: { fetch: noStoreFetch } });` },

    { file: 'app/__admin__/tavsiya/page.js', find: `title: 'Tavsiya va belgilar | EduSearcher'`, replace: `title: 'Belgilar va kontaktlar | EduSearcher'` },

    // Filial telefonlari yashirilgan paytda ham boshqaruvda ko'rinadi
    { file: 'components/CenterManager.js', re: /setD\(data\);(\s*)\}, \[centerId\]\);/, replace: `const { data: bp } = await supabase.from('branch_contacts').select('branch_id,phone').eq('center_id', centerId);\n    const ph = Object.fromEntries((bp || []).map((x) => [x.branch_id, x.phone]));\n    if (data) data.branches = (data.branches || []).map((b) => ({ ...b, phone: ph[b.id] ?? b.phone }));\n    setD(data);$1}, [centerId]);` }
  ]
};
