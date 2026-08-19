-- =========================================================
-- Esquema para "Casa al día" (gestión de servicios compartidos)
-- Ejecutar en el SQL Editor de Supabase (proyecto nuevo o existente)
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- Cuentas (casas + admin). Login simple: usuario + contraseña
-- en texto plano, SIN autenticación real de Supabase Auth.
-- Esto es intencional (pedido explícito de mínima seguridad),
-- pero implica que cualquiera con la anon key puede leer la
-- tabla si no restringís el acceso desde afuera de esta app.
-- ---------------------------------------------------------
create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password text not null,
  role text not null check (role in ('admin', 'house')),
  display_name text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- Periodos: un registro por casa y por mes.
-- ---------------------------------------------------------
create table if not exists periods (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references accounts(id) on delete cascade,
  month date not null, -- siempre primer día del mes, ej 2026-08-01
  funding_mode text not null default 'exacto' check (funding_mode in ('fijo', 'exacto')),
  fixed_amount numeric,
  created_at timestamptz not null default now(),
  unique (house_id, month)
);

-- ---------------------------------------------------------
-- Integrantes de un periodo (quién vivía ese mes, qué fracción
-- del mes le corresponde pagar, si ya aportó su parte).
-- ---------------------------------------------------------
create table if not exists period_members (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references periods(id) on delete cascade,
  name text not null,
  fraction numeric not null default 1 check (fraction >= 0 and fraction <= 1),
  override_amount numeric,
  paid boolean not null default false,
  paid_at timestamptz
);

-- ---------------------------------------------------------
-- Facturas cargadas para un periodo.
-- ---------------------------------------------------------
create table if not exists bills (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references accounts(id) on delete cascade,
  period_id uuid not null references periods(id) on delete cascade,
  service_name text not null,
  type text not null default 'mensual' check (type in ('mensual', 'bimestral')),
  period_label text,
  due_date date,
  amount numeric not null default 0,
  file_url text,
  file_name text,
  paid boolean not null default false,
  paid_at timestamptz,
  created_by text,
  created_at timestamptz not null default now()
);

create index if not exists idx_periods_house on periods(house_id);
create index if not exists idx_period_members_period on period_members(period_id);
create index if not exists idx_bills_period on bills(period_id);
create index if not exists idx_bills_house on bills(house_id);

-- ---------------------------------------------------------
-- RLS: como no hay autenticación real de Supabase, toda la
-- app opera con la anon key. Habilitamos RLS pero con
-- políticas abiertas (permitir todo) para que la app funcione;
-- el "login" queda como una barrera de uso, no de seguridad.
-- Si más adelante querés subir el nivel de seguridad, esto es
-- lo primero que hay que migrar a Supabase Auth + RLS por usuario.
-- ---------------------------------------------------------
alter table accounts enable row level security;
alter table periods enable row level security;
alter table period_members enable row level security;
alter table bills enable row level security;

create policy "accounts_all" on accounts for all using (true) with check (true);
create policy "periods_all" on periods for all using (true) with check (true);
create policy "period_members_all" on period_members for all using (true) with check (true);
create policy "bills_all" on bills for all using (true) with check (true);

-- ---------------------------------------------------------
-- Cuentas iniciales pedidas
-- ---------------------------------------------------------
insert into accounts (username, password, role, display_name) values
  ('rayuela', 'dorrego3362', 'house', 'Rayuela'),
  ('macondo', 'dorrego3262', 'house', 'Macondo'),
  ('admin', 'admin3011', 'admin', 'Administración')
on conflict (username) do nothing;

-- =========================================================
-- Storage: bucket para fotos/archivos de facturas.
-- Podés crearlo desde el Dashboard (Storage > New bucket,
-- nombre "facturas", marcado como público) o corriendo esto:
-- =========================================================
insert into storage.buckets (id, name, public)
values ('facturas', 'facturas', true)
on conflict (id) do nothing;

-- Políticas abiertas para el bucket (mismo criterio que arriba:
-- sin autenticación real, así que el control de acceso lo da
-- únicamente el login de la app).
create policy "facturas_read" on storage.objects for select
  using (bucket_id = 'facturas');
create policy "facturas_write" on storage.objects for insert
  with check (bucket_id = 'facturas');
create policy "facturas_delete" on storage.objects for delete
  using (bucket_id = 'facturas');
