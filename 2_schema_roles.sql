-- Rollar va shartnoma asosida kirish
-- schema.sql dan KEYIN Supabase SQL Editor'da ishga tushiring.

-- 1) Foydalanuvchi profillari va rollar
create type user_role as enum ('user', 'center_owner', 'admin');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'user',
  full_name text,
  created_at timestamptz default now()
);

-- Ro'yxatdan o'tganda profil avtomatik yaratiladi
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id) values (new.id);
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Mavjud foydalanuvchilar uchun profil
insert into profiles (id) select id from auth.users on conflict do nothing;

-- 2) Shartnoma ma'lumotlari markazga qo'shiladi
create type contract_status as enum ('none', 'pending', 'active', 'expired');

alter table centers
  add column contract_status contract_status not null default 'none',
  add column contract_number text,
  add column contract_start date,
  add column contract_end date;

-- 3) Yordamchi funksiyalar
create or replace function is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- Admin yoki faol shartnomali markaz egasi tahrirlay oladi
create or replace function can_manage_center(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select is_admin() or exists (
    select 1 from centers
    where id = cid
      and owner_id = auth.uid()
      and contract_status = 'active'
      and (contract_end is null or contract_end >= current_date)
  );
$$;

-- 4) Eski siyosatlarni almashtirish
drop policy "owner manages center"   on centers;
drop policy "owner manages branches" on branches;
drop policy "owner manages courses"  on courses;

-- Markaz: admin hammasini; shartnomali ega faqat o'z markazini tahrirlaydi
create policy "admin manages centers" on centers
  for all using (is_admin()) with check (is_admin());

create policy "owner updates center" on centers
  for update using (can_manage_center(id)) with check (can_manage_center(id));

-- Filial va kurslar
create policy "manage branches" on branches
  for all using (can_manage_center(center_id)) with check (can_manage_center(center_id));

create policy "manage courses" on courses
  for all using (can_manage_center(center_id)) with check (can_manage_center(center_id));

-- Profillar: o'zini ko'radi, rolni faqat admin o'zgartiradi
alter table profiles enable row level security;

create policy "read own profile" on profiles
  for select using (auth.uid() = id or is_admin());

create policy "admin manages profiles" on profiles
  for all using (is_admin()) with check (is_admin());

-- 5) Ega muhim maydonlarni o'zgartira olmasligi uchun himoya
create or replace function protect_center_fields()
returns trigger language plpgsql as $$
begin
  if not is_admin() then
    new.owner_id        := old.owner_id;
    new.is_verified     := old.is_verified;
    new.rating          := old.rating;
    new.contract_status := old.contract_status;
    new.contract_number := old.contract_number;
    new.contract_start  := old.contract_start;
    new.contract_end    := old.contract_end;
  end if;
  return new;
end $$;

create trigger protect_center_fields_trg
  before update on centers
  for each row execute function protect_center_fields();

-- ---------------------------------------------------------------
-- FOYDALANISH
-- ---------------------------------------------------------------
-- Birinchi adminni tayinlash (o'z emailingizni yozing, avval saytda ro'yxatdan o'ting):
--   update profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'sizning@email.com');
--
-- Shartnoma tuzilgan markazga egasini biriktirish:
--   update centers set
--     owner_id = '<foydalanuvchi uuid>',
--     contract_status = 'active',
--     contract_number = 'SH-001',
--     contract_start = current_date,
--     contract_end = current_date + interval '1 year'
--   where id = '<markaz uuid>';
--   update profiles set role = 'center_owner' where id = '<foydalanuvchi uuid>';
