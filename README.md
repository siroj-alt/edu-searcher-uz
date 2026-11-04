# EduSearcher — O'quv markazlar sayti (edusarcher.uz)

Next.js 14 + Supabase. Vercel'ga joylashga tayyor.

## 1. Supabase
1. supabase.com da yangi loyiha oching.
2. **SQL Editor** da ketma-ket ishga tushiring: `supabase/1_schema.sql`, keyin `supabase/2_schema_roles.sql`.
3. **Project Settings > API** dan `Project URL` va `anon public` kalitni oling.

## 2. Kompyuterda sinash
```
cp .env.example .env.local     # ichiga Supabase URL va kalitni yozing
npm install
npm run dev                    # http://localhost:3000
```

## 3. GitHub
```
git init
git add .
git commit -m "Birinchi versiya"
git branch -M main
git remote add origin https://github.com/USERNAME/edusearcher.git
git push -u origin main
```

## 4. Vercel
1. vercel.com > **Add New > Project** > GitHub'dagi repozitoriyani tanlang.
2. **Environment Variables** ga qo'shing: `NEXT_PUBLIC_SUPABASE_URL` va `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. **Deploy** bosing.
4. Supabase > **Authentication > URL Configuration**: `Site URL` ga Vercel manzilini yozing.

## 5. Birinchi adminni tayinlash
Saytda `/login` orqali ro'yxatdan o'ting, keyin SQL Editor'da:
```
update profiles set role = 'admin'
where id = (select id from auth.users where email = 'sizning@email.com');
```

## 6. Shartnomali markazga ega biriktirish
Buyruqlar `supabase/2_schema_roles.sql` oxirida. Markaz egasi avval saytda ro'yxatdan o'tadi, keyin admin uning `uuid`sini markazga biriktiradi.
