-- O'quv markazlar sayti: Supabase (PostgreSQL + PostGIS)
-- Supabase SQL Editor'ga to'liq nusxalab, Run bosing.

create extension if not exists postgis;

-- Daraja turi
create type course_level as enum ('beginner', 'intermediate', 'advanced');

-- Viloyat va tumanlar
create table regions (
  id serial primary key,
  name text not null unique
);

create table districts (
  id serial primary key,
  region_id int not null references regions(id) on delete cascade,
  name text not null,
  unique (region_id, name)
);

-- Kurs yo'nalishlari (Ingliz tili, IT, Matematika...)
create table categories (
  id serial primary key,
  name text not null unique,
  slug text not null unique
);

-- O'quv markaz
create table centers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  name text not null,
  description text,
  logo_url text,
  website text,
  telegram text,
  rating numeric(2,1) default 0,
  is_verified boolean default false,
  created_at timestamptz default now()
);

-- Filiallar (har bir filialning o'z manzili va koordinatasi bor)
create table branches (
  id uuid primary key default gen_random_uuid(),
  center_id uuid not null references centers(id) on delete cascade,
  district_id int references districts(id),
  address text not null,
  phone text,
  location geography(Point, 4326) not null
);
create index branches_location_idx on branches using gist (location);

-- Kurslar
create table courses (
  id uuid primary key default gen_random_uuid(),
  center_id uuid not null references centers(id) on delete cascade,
  category_id int not null references categories(id),
  name text not null,
  level course_level not null,
  price_monthly int,              -- so'mda
  duration_months int,
  schedule text,                  -- masalan: "Du-Chor-Ju 18:00"
  created_at timestamptz default now()
);
create index courses_filter_idx on courses (category_id, level);

-- Sharhlar
create table reviews (
  id uuid primary key default gen_random_uuid(),
  center_id uuid not null references centers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  stars int not null check (stars between 1 and 5),
  comment text,
  created_at timestamptz default now(),
  unique (center_id, user_id)
);

-- TAVSIYA FUNKSIYASI: yo'nalish + daraja + foydalanuvchi joylashuvi
-- Natija: eng yaqin va eng yuqori reytingli mos kurslar
create or replace function recommend_courses(
  p_category_id int,
  p_level course_level,
  p_lat double precision,
  p_lng double precision,
  p_max_km double precision default 15,
  p_limit int default 20
)
returns table (
  course_id uuid,
  course_name text,
  price_monthly int,
  schedule text,
  center_id uuid,
  center_name text,
  rating numeric,
  branch_id uuid,
  address text,
  phone text,
  distance_km double precision,
  score double precision
)
language sql stable as $$
  select
    c.id, c.name, c.price_monthly, c.schedule,
    ce.id, ce.name, ce.rating,
    b.id, b.address, b.phone,
    d.km,
    -- Ball: yaqinlik 70%, reyting 30%
    (1 - least(d.km / p_max_km, 1)) * 0.7 + (ce.rating / 5.0)::double precision * 0.3
  from courses c
  join centers ce on ce.id = c.center_id
  join branches b on b.center_id = ce.id
  cross join lateral (
    select (st_distance(
      b.location,
      st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography
    ) / 1000.0)::double precision as km
  ) d
  where c.category_id = p_category_id
    and c.level = p_level
    and d.km <= p_max_km
  order by 12 desc
  limit p_limit;
$$;

-- Xavfsizlik (RLS): hamma o'qiy oladi, faqat markaz egasi o'zgartiradi
alter table regions    enable row level security;
alter table districts  enable row level security;
alter table categories enable row level security;
alter table centers    enable row level security;
alter table branches   enable row level security;
alter table courses    enable row level security;
alter table reviews    enable row level security;

create policy "public read" on regions    for select using (true);
create policy "public read" on districts  for select using (true);
create policy "public read" on categories for select using (true);
create policy "public read" on centers    for select using (true);
create policy "public read" on branches   for select using (true);
create policy "public read" on courses    for select using (true);
create policy "public read" on reviews    for select using (true);

create policy "owner manages center" on centers
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "owner manages branches" on branches
  for all using (exists (select 1 from centers where id = center_id and owner_id = auth.uid()));

create policy "owner manages courses" on courses
  for all using (exists (select 1 from centers where id = center_id and owner_id = auth.uid()));

create policy "user writes own review" on reviews
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Boshlang'ich ma'lumotlar
insert into categories (name, slug) values
  ('Ingliz tili', 'english'),
  ('Rus tili', 'russian'),
  ('Dasturlash (IT)', 'it'),
  ('Matematika', 'math'),
  ('IELTS', 'ielts');

insert into regions (name) values
  ('Toshkent shahri'), ('Toshkent viloyati'), ('Samarqand'), ('Buxoro'),
  ('Farg''ona'), ('Andijon'), ('Namangan'), ('Xorazm'), ('Qashqadaryo'),
  ('Surxondaryo'), ('Navoiy'), ('Jizzax'), ('Sirdaryo'), ('Qoraqalpog''iston');
