# EduSearcher (edusearcher.uz) — v3 yangilanishi

Bu branchda saytning **v3 versiyasida qo'shilgan va o'zgartirilgan fayllari** turadi:

- `site/` — yangi va almashtirilgan fayllar (Next.js loyihasidagi o'z joylari bilan).
  Admin panel sahifalari `site/app/__admin__/` ichida turadi; build paytida ular saytning yopiq admin manziliga ko'chiriladi.
- `site.config.mjs` — mavjud fayllarga kiritiladigan kichik tuzatishlar va o'chiriladigan fayllar ro'yxati.

Vercel'dagi build shu branchni yuklab oladi, fayllarni loyihaga qo'shadi va keyin `next build` ishlaydi.
Shuning uchun **bu branchni o'chirmang**: saytni qayta build qilishda kerak bo'ladi.

## v3 da nima qo'shildi

- Foydalanuvchi kabineti (`/kirish`, `/kabinet`): login + parol, saqlangan markazlar, arizalar, o'qiyotgan kurslar, oylik to'lovlar.
- O'quv markazi kabineti (`/markaz-kabineti`): statistika, arizalar, o'quvchilar, to'lovlar, markaz ma'lumotlari.
- O'qishga ariza berish («sinov darsi» o'rniga): ariza markaz paneliga va bosh admin paneliga tushadi.
- Bosh admin: markazlarga kabinet ochish, aloqa ma'lumotlarini bittada yoki alohida yashirish/ko'rsatish, foydalanuvchilar.
- 19 ta yangi yo'nalish (kimyo, biologiya, tarix, huquq, kiberxavfsizlik, sun'iy intellekt va boshqalar).

Ma'lumotlar bazasi o'zgarishlari Supabase loyihasidagi `v3_*` migratsiyalarida saqlangan.
