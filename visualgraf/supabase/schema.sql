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
  category text not null default 'troquelada',
  images jsonb not null default '[]',
  sizes text[] not null default '{}',
  colors text[] not null default '{}',
  tiers jsonb not null default '[]',      -- [{ "min": 100, "unitPrice": 320 }, ...]
  features text[] not null default '{}',
  featured boolean not null default false,
  active boolean not null default true,
  sort int not null default 0,
  updated_at timestamptz not null default now()
);

-- ───────────── Promociones ─────────────
create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  badge text not null default 'Promo',
  code text,
  discount_percent int check (discount_percent between 0 and 90),
  ends_at date,
  image text,
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

-- ───────────── Datos iniciales (precios de EJEMPLO, editarlos) ─────────────
insert into public.products (id, slug, name, short, description, category, images, sizes, colors, tiers, features, featured, sort)
values
(
  'troquelada', 'bolsa-troquelada-personalizada', 'Bolsa troquelada personalizada',
  'La clásica para locales y emprendimientos. Manija troquelada y tu logo impreso.',
  'Bolsa de polietileno con manija troquelada, ideal para indumentaria, regalería, cosmética y comercios en general. Elegí el color de bolsa y el color de impresión que mejor representen a tu marca. Impresión en serigrafía, nítida y resistente.',
  'troquelada',
  '[{"src":"/img/bolsa-blanca.webp","alt":"Bolsa troquelada blanca con logo marrón impreso"},{"src":"/img/bolsa-negra.webp","alt":"Bolsa troquelada negra con logo blanco impreso"},{"src":"/img/bolsa-cristal.webp","alt":"Bolsa troquelada cristal con logo blanco impreso"},{"src":"/img/bolsa-lila.webp","alt":"Bolsa troquelada lila pastel con logo negro impreso"}]',
  '{"20 × 30 cm","30 × 40 cm","40 × 50 cm"}', '{blanco,negro,cristal,lila}',
  '[{"min":100,"unitPrice":320},{"min":500,"unitPrice":240},{"min":1000,"unitPrice":190}]',
  '{"4 colores de bolsa","11 colores de impresión","Impresión en serigrafía","1 o 2 caras"}', true, 1
),
(
  'hielo-rinon', 'bolsa-para-hielo-manija-rinon', 'Bolsa para hielo con manija riñón',
  '26 × 50 cm · 60 micrones. Para llevar el hielo con una mano.',
  'Nuevo ingreso. Bolsa cristal para hielo con manija riñón, pensada para fábricas de hielo, distribuidoras, almacenes y estaciones de servicio. 26 × 50 cm en 60 micrones, resistente al peso y al frío. Tu marca bien visible en cada bolsa.',
  'hielo',
  '[{"src":"/img/bolsa-hielo.webp","alt":"Bolsa cristal para hielo con manija riñón y logo azul impreso"},{"src":"/img/manija-rinon.webp","alt":"Detalle de la manija riñón de la bolsa para hielo"},{"src":"/img/tu-logo-aca.webp","alt":"Bolsa para hielo con la leyenda Tu logo acá impresa en azul"}]',
  '{"26 × 50 cm · 60 micrones"}', '{cristal}',
  '[{"min":500,"unitPrice":210},{"min":1000,"unitPrice":170},{"min":3000,"unitPrice":140}]',
  '{"Manija riñón","60 micrones","Resistente al frío","Ideal 2 a 3 kg"}', true, 2
),
(
  'hielo-clasica', 'bolsa-para-hielo-clasica', 'Bolsa para hielo clásica',
  'Cristal, para cerrar con precinto o nudo. Tu marca en cada bolsa.',
  '¿Vendés hielo? Poné tu marca en cada bolsa. Bolsa cristal para hielo, para cerrar con precinto o nudo, con impresión de tu logo, teléfono y peso aproximado. Ideal para hielo en rolitos o cubos.',
  'hielo',
  '[{"src":"/img/bolsa-hielo-rolito.webp","alt":"Bolsa de hielo cristal cerrada con precinto y logo Tu Rolito impreso en azul"}]',
  '{"2 kg aprox.","4 kg aprox."}', '{cristal}',
  '[{"min":1000,"unitPrice":95},{"min":3000,"unitPrice":80},{"min":5000,"unitPrice":68}]',
  '{"Cristal","Cierre con precinto","Impresión 1 color","Alta producción"}', true, 3
)
on conflict (id) do nothing;

-- Para hacer admin a un usuario (creado en Authentication → Users):
-- insert into public.admins (user_id) select id from auth.users where email = 'TU_EMAIL';
