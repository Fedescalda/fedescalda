-- VisualGraf · Migración 002: compra automática
-- Logo del cliente, envío por zona, prueba de diseño, seguimiento y configuración.
-- Idempotente: se puede correr más de una vez.

-- ───────────── Pedidos: columnas nuevas ─────────────
alter table public.orders add column if not exists access_token text not null default replace(gen_random_uuid()::text, '-', '');
alter table public.orders add column if not exists shipping numeric not null default 0;
alter table public.orders add column if not exists shipping_zone text;
alter table public.orders add column if not exists logo_path text;          -- archivo original del cliente (bucket pedidos)
alter table public.orders add column if not exists mockup_path text;        -- imagen del simulador (bucket pedidos)
alter table public.orders add column if not exists proof_path text;         -- prueba de diseño subida por el admin
alter table public.orders add column if not exists proof_status text not null default 'pendiente'; -- pendiente | enviada | aprobada | cambios
alter table public.orders add column if not exists proof_feedback text;
alter table public.orders add column if not exists carrier text;
alter table public.orders add column if not exists tracking_code text;
alter table public.orders add column if not exists history jsonb not null default '[]';  -- [{ status, at, note }]
alter table public.orders add column if not exists updated_at timestamptz not null default now();
create unique index if not exists orders_access_token_idx on public.orders (access_token);

-- Estados: pendiente | pagado | diseno | en_produccion | enviado | entregado | cancelado
-- payment_method: mercadopago | transferencia | whatsapp

-- ───────────── Configuración del sitio (envíos, transferencia) ─────────────
create table if not exists public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.settings enable row level security;
drop policy if exists "settings: lectura pública" on public.settings;
create policy "settings: lectura pública" on public.settings for select using (true);
drop policy if exists "settings: admin escribe" on public.settings;
create policy "settings: admin escribe" on public.settings for all using (public.is_admin()) with check (public.is_admin());

-- Envíos: desactivados hasta que el admin cargue sus precios ("a coordinar")
insert into public.settings (key, value) values (
  'shipping',
  '{
    "enabled": false,
    "freeFrom": null,
    "zones": [
      { "id": "amba", "name": "CABA y GBA", "price": null, "provinces": ["CABA", "Buenos Aires"] },
      { "id": "centro", "name": "Centro y Litoral", "price": null, "provinces": ["Santa Fe", "Córdoba", "Entre Ríos", "La Pampa"] },
      { "id": "norte", "name": "Norte", "price": null, "provinces": ["Corrientes", "Misiones", "Chaco", "Formosa", "Santiago del Estero", "Tucumán", "Salta", "Jujuy", "Catamarca"] },
      { "id": "cuyo", "name": "Cuyo", "price": null, "provinces": ["Mendoza", "San Juan", "San Luis", "La Rioja"] },
      { "id": "patagonia", "name": "Patagonia", "price": null, "provinces": ["Neuquén", "Río Negro", "Chubut", "Santa Cruz", "Tierra del Fuego"] }
    ]
  }'::jsonb
) on conflict (key) do nothing;

-- ───────────── Storage privado para archivos de pedidos ─────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('pedidos', 'pedidos', false, 10485760, array['image/png','image/jpeg','image/webp','image/svg+xml','application/pdf'])
on conflict (id) do nothing;
-- Sin políticas para anon/authenticated: solo el servidor (service role) lee y escribe.
-- El panel y el cliente acceden con URLs firmadas temporales.
