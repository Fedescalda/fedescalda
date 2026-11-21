-- VisualGraf · esquema de base de datos para Supabase
-- Cómo usarlo: Supabase → SQL Editor → pegar todo → Run.
-- Es idempotente: se puede correr más de una vez.

-- ───────────── Administradores ─────────────
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ───────────── Productos ─────────────
create table if not exists public.products (
  id text primary key,
  slug text unique not null,
  name text not null,
  short text not null default '',
  description text not null default '',
  category text not null default 'manija-rinon',   -- manija-rinon | hielo | ecommerce
  images jsonb not null default '[]',              -- [{ "src": "/img/...", "alt": "..." }]
  pack_size int not null default 100,              -- unidades por pack
  variants jsonb not null default '[]',            -- [{ "size": "20 × 30 cm", "price": 44000 }]  price null = a cotizar
  colors text[] not null default '{}',
  features text[] not null default '{}',
  featured boolean not null default false,
  active boolean not null default true,
  sort int not null default 0,
  updated_at timestamptz not null default now()
);

-- ───────────── Promociones ─────────────
create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  title text not null,
  description text not null default '',
  badge text not null default 'Promo',
  price numeric,
  price_note text,
  details jsonb,                                    -- [{ "label": "26 × 40 cm", "value": "500 u. · 40 mic" }]
  code text,
  discount_percent int check (discount_percent between 0 and 90),
  ends_at date,
  image text,
  cta text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ───────────── Consultas del formulario de contacto ─────────────
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  business text,
  email text not null,
  phone text,
  province text,
  interest text,
  message text not null,
  status text not null default 'nuevo',   -- nuevo | respondido
  created_at timestamptz not null default now()
);

-- ───────────── Pedidos ─────────────
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer jsonb not null,                 -- nombre, email, teléfono, dirección…
  items jsonb not null,                    -- líneas del carrito
  subtotal numeric not null,
  discount numeric not null default 0,
  total numeric not null,
  promo_code text,
  payment_method text not null,            -- mercadopago | whatsapp
  status text not null default 'pendiente',-- pendiente | pagado | en_produccion | enviado | cancelado
  mp_preference_id text,
  mp_payment_id text,
  created_at timestamptz not null default now()
);

-- ───────────── Seguridad (RLS) ─────────────
alter table public.admins enable row level security;
alter table public.products enable row level security;
alter table public.promotions enable row level security;
alter table public.contact_messages enable row level security;
alter table public.orders enable row level security;

drop policy if exists "admins: ver propio" on public.admins;
create policy "admins: ver propio" on public.admins for select using (user_id = auth.uid());

drop policy if exists "productos: lectura pública" on public.products;
create policy "productos: lectura pública" on public.products for select using (active or public.is_admin());
drop policy if exists "productos: admin escribe" on public.products;
create policy "productos: admin escribe" on public.products for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "promos: lectura pública" on public.promotions;
create policy "promos: lectura pública" on public.promotions for select using (active or public.is_admin());
drop policy if exists "promos: admin escribe" on public.promotions;
create policy "promos: admin escribe" on public.promotions for all using (public.is_admin()) with check (public.is_admin());

-- Consultas y pedidos: los inserta el servidor (service role). Solo admins leen y actualizan.
drop policy if exists "consultas: admin" on public.contact_messages;
create policy "consultas: admin" on public.contact_messages for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "pedidos: admin" on public.orders;
create policy "pedidos: admin" on public.orders for all using (public.is_admin()) with check (public.is_admin());

-- ───────────── Datos iniciales ─────────────
-- Después de este archivo, corré supabase/seed.sql (productos y promos reales de la web).

-- Para hacer admin a un usuario (creado en Authentication → Users):
-- insert into public.admins (user_id) select id from auth.users where email = 'TU_EMAIL';
