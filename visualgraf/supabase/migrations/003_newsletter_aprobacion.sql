-- VisualGraf · Migración 003: newsletter y aprobación formal del diseño. Idempotente.

-- ───────────── Newsletter ─────────────
create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text,
  source text not null default 'web',          -- footer | home | checkout | admin
  status text not null default 'activo',       -- activo | baja
  unsubscribe_token text not null default replace(gen_random_uuid()::text, '-', ''),
  consent_at timestamptz not null default now(),
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists subscribers_email_idx on public.subscribers (lower(email));
create unique index if not exists subscribers_token_idx on public.subscribers (unsubscribe_token);
alter table public.subscribers enable row level security;
drop policy if exists "suscriptores: admin" on public.subscribers;
create policy "suscriptores: admin" on public.subscribers for all using (public.is_admin()) with check (public.is_admin());
-- Altas y bajas las hace el servidor (service role).

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  preheader text,
  body text not null,                          -- texto con párrafos (se convierte a HTML seguro)
  image text,
  cta_label text,
  cta_url text,
  status text not null default 'borrador',     -- borrador | enviada
  recipients int not null default 0,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.campaigns enable row level security;
drop policy if exists "campañas: admin" on public.campaigns;
create policy "campañas: admin" on public.campaigns for all using (public.is_admin()) with check (public.is_admin());

-- ───────────── Aprobación del diseño ─────────────
alter table public.orders add column if not exists terms_accepted_at timestamptz;   -- acepta condiciones de diseño en el checkout
alter table public.orders add column if not exists proof_version int not null default 0;
alter table public.orders add column if not exists proof_approved_at timestamptz;
alter table public.orders add column if not exists proof_approved_ip text;
alter table public.orders add column if not exists proof_approved_path text;      -- copia exacta de la versión aprobada
alter table public.orders add column if not exists design jsonb;                   -- datos del simulador (medida, colores, textos, cm)
