-- Schema completo do Supabase para Don Luydd Pizzaria
-- Inclui:
--   1. Pedidos (`orders`)
--   2. Configurações completas da loja (`store_settings`: status, PIX, horários, contato, retiradas)
--   3. Usuários administrativos com perfis (`admin_users`: owner | kitchen vinculados ao Supabase Auth)
--   4. Catálogo dinâmico completo (`pizzas`, `drinks`, `combos`, `crust_options`,
--      `extra_ingredients`, `delivery_neighborhoods`)
--   5. Publicação Supabase Realtime para status da loja e catálogo
--
-- Execute este script no SQL Editor do painel do Supabase (é seguro rodar mais de uma vez).
-- IMPORTANTE: configure SUPABASE_SERVICE_ROLE_KEY no servidor Next.js (.env.local / host).

-- ============================================================================
-- 1. PEDIDOS
-- ============================================================================
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  customer_name text not null,
  customer_phone text,
  delivery_type text not null default 'delivery',
  address text,
  bairro text,
  cep text,
  complement text,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(10,2) not null default 0,
  delivery_fee numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  payment_method text not null,
  change_for numeric(10,2),
  status text not null default 'pending',
  notes text,
  whatsapp_notifications boolean not null default false
);

alter table public.orders
  add column if not exists whatsapp_notifications boolean not null default false;

create index if not exists idx_orders_created_at on public.orders (created_at desc);
create index if not exists idx_orders_status on public.orders (status);

alter table public.orders enable row level security;

drop policy if exists "Permitir criacao de pedidos" on public.orders;
drop policy if exists "Permitir leitura de pedidos" on public.orders;
drop policy if exists "Permitir atualizacao de pedidos" on public.orders;

-- ============================================================================
-- 2. CONFIGURAÇÕES DA LOJA (Status, PIX, Horários, Contato, Retiradas)
-- ============================================================================
create table if not exists public.store_settings (
  id text primary key default 'main',
  is_open boolean not null default false,
  mode text not null default 'auto', -- 'auto' | 'open' | 'closed'
  custom_message text,
  store_name text not null default 'Don Luydd Pizzaria',
  pickup_address text not null default 'Av. Epitácio Pessoa, 1200 - Centro',
  street_district text not null default 'Av. Epitácio Pessoa, Centro',
  city text not null default 'João Pessoa',
  whatsapp_number text not null default '5583993740352',
  whatsapp_display text not null default '(83) 99374-0352',
  instagram_url text not null default 'https://www.instagram.com/pizzariadonluydd/',
  instagram_handle text not null default '@pizzariadonluydd',
  pix_key text not null default '83993740352',
  pix_key_display text not null default '(83) 99374-0352',
  pix_key_type text not null default 'Telefone',
  pix_recipient text not null default 'Don Luydd Pizzaria',
  oven_label text not null default 'Forno elétrico',
  estimated_delivery text not null default '35–50 min',
  estimated_pickup text not null default '20–30 min',
  schedule jsonb not null default '{
    "0": {"enabled": true,  "open": "18:00", "close": "22:00"},
    "1": {"enabled": false, "open": "18:00", "close": "22:00"},
    "2": {"enabled": true,  "open": "18:00", "close": "22:00"},
    "3": {"enabled": true,  "open": "18:00", "close": "22:00"},
    "4": {"enabled": true,  "open": "18:00", "close": "22:00"},
    "5": {"enabled": true,  "open": "18:00", "close": "22:00"},
    "6": {"enabled": true,  "open": "18:00", "close": "22:00"}
  }'::jsonb,
  common_removals text[] not null default '{"Sem Cebola","Sem Azeitona","Sem Tomate","Sem Orégano"}',
  sweet_removals text[] not null default '{"Sem Leite Condensado","Sem Canela","Sem Granulado"}',
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Migração idempotente caso store_settings já exista na versão anterior
alter table public.store_settings
  add column if not exists store_name text not null default 'Don Luydd Pizzaria',
  add column if not exists pickup_address text not null default 'Av. Epitácio Pessoa, 1200 - Centro',
  add column if not exists street_district text not null default 'Av. Epitácio Pessoa, Centro',
  add column if not exists city text not null default 'João Pessoa',
  add column if not exists whatsapp_number text not null default '5583993740352',
  add column if not exists whatsapp_display text not null default '(83) 99374-0352',
  add column if not exists instagram_url text not null default 'https://www.instagram.com/pizzariadonluydd/',
  add column if not exists instagram_handle text not null default '@pizzariadonluydd',
  add column if not exists pix_key text not null default '83993740352',
  add column if not exists pix_key_display text not null default '(83) 99374-0352',
  add column if not exists pix_key_type text not null default 'Telefone',
  add column if not exists pix_recipient text not null default 'Don Luydd Pizzaria',
  add column if not exists oven_label text not null default 'Forno elétrico',
  add column if not exists estimated_delivery text not null default '35–50 min',
  add column if not exists estimated_pickup text not null default '20–30 min',
  add column if not exists schedule jsonb not null default '{
    "0": {"enabled": true,  "open": "18:00", "close": "22:00"},
    "1": {"enabled": false, "open": "18:00", "close": "22:00"},
    "2": {"enabled": true,  "open": "18:00", "close": "22:00"},
    "3": {"enabled": true,  "open": "18:00", "close": "22:00"},
    "4": {"enabled": true,  "open": "18:00", "close": "22:00"},
    "5": {"enabled": true,  "open": "18:00", "close": "22:00"},
    "6": {"enabled": true,  "open": "18:00", "close": "22:00"}
  }'::jsonb,
  add column if not exists common_removals text[] not null default '{"Sem Cebola","Sem Azeitona","Sem Tomate","Sem Orégano"}',
  add column if not exists sweet_removals text[] not null default '{"Sem Leite Condensado","Sem Canela","Sem Granulado"}';

alter table public.store_settings enable row level security;

drop policy if exists "Permitir leitura de store_settings" on public.store_settings;
drop policy if exists "Permitir insercao de store_settings" on public.store_settings;
drop policy if exists "Permitir atualizacao de store_settings" on public.store_settings;
drop policy if exists "Permitir leitura publica de store_settings" on public.store_settings;

create policy "Permitir leitura publica de store_settings"
  on public.store_settings for select
  to anon, authenticated
  using (true);

insert into public.store_settings (id, mode, is_open, custom_message)
values ('main', 'auto', false, null)
on conflict (id) do nothing;

-- ============================================================================
-- 3. USUÁRIOS ADMINISTRATIVOS (Supabase Auth + Perfis: owner | kitchen)
-- ============================================================================
create table if not exists public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text not null default '',
  role text not null default 'kitchen' check (role in ('owner', 'kitchen')),
  active boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.admin_users enable row level security;

drop policy if exists "Admin le proprio perfil" on public.admin_users;
create policy "Admin le proprio perfil"
  on public.admin_users for select
  to authenticated
  using (auth.uid() = id);

-- ============================================================================
-- 4. LIMPEZA DE TABELA LEGADA (substituída pela coluna `available` no catálogo)
-- ============================================================================
drop table if exists public.menu_stock cascade;

-- ============================================================================
-- 5. CATÁLOGO DINÂMICO — PIZZAS (Salgadas e Doces)
-- ============================================================================
create table if not exists public.pizzas (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text not null default '',
  category text not null check (category in ('salgada', 'doce')),
  price_p numeric(10,2) not null,
  price_m numeric(10,2) not null,
  price_g numeric(10,2) not null,
  image_url text, -- URL do Cloudinary ou imagem estática
  tags text[] not null default '{}',
  highlight boolean not null default false,
  available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_pizzas_category_sort on public.pizzas (category, sort_order, name);

alter table public.pizzas enable row level security;
drop policy if exists "Permitir leitura publica de pizzas" on public.pizzas;
create policy "Permitir leitura publica de pizzas"
  on public.pizzas for select
  to anon, authenticated
  using (true);

-- ============================================================================
-- 6. CATÁLOGO DINÂMICO — BEBIDAS
-- ============================================================================
create table if not exists public.drinks (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text not null default '',
  price numeric(10,2) not null,
  icon text not null default 'coca',
  image_url text, -- URL opcional no Cloudinary
  tags text[] not null default '{}',
  available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.drinks enable row level security;
drop policy if exists "Permitir leitura publica de drinks" on public.drinks;
create policy "Permitir leitura publica de drinks"
  on public.drinks for select
  to anon, authenticated
  using (true);

-- ============================================================================
-- 7. CATÁLOGO DINÂMICO — COMBOS
-- ============================================================================
create table if not exists public.combos (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text not null default '',
  price numeric(10,2) not null,
  original_price numeric(10,2) not null,
  image_url text, -- URL opcional no Cloudinary
  items text[] not null default '{}',
  pizza_slots jsonb not null default '[]'::jsonb,
  drink_slots jsonb,
  fixed_drink_label text,
  available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.combos enable row level security;
drop policy if exists "Permitir leitura publica de combos" on public.combos;
create policy "Permitir leitura publica de combos"
  on public.combos for select
  to anon, authenticated
  using (true);

-- ============================================================================
-- 8. CATÁLOGO DINÂMICO — BORDAS RECHEADAS
-- ============================================================================
create table if not exists public.crust_options (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  price numeric(10,2) not null default 0,
  compatible_with text[] not null default '{salgada}',
  available boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.crust_options enable row level security;
drop policy if exists "Permitir leitura publica de crust_options" on public.crust_options;
create policy "Permitir leitura publica de crust_options"
  on public.crust_options for select
  to anon, authenticated
  using (true);

-- ============================================================================
-- 9. CATÁLOGO DINÂMICO — ADICIONAIS
-- ============================================================================
create table if not exists public.extra_ingredients (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  price numeric(10,2) not null,
  compatible_with text[] not null default '{salgada}',
  available boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.extra_ingredients enable row level security;
drop policy if exists "Permitir leitura publica de extra_ingredients" on public.extra_ingredients;
create policy "Permitir leitura publica de extra_ingredients"
  on public.extra_ingredients for select
  to anon, authenticated
  using (true);

-- ============================================================================
-- 10. CATÁLOGO DINÂMICO — BAIRROS E TAXAS DE ENTREGA
-- ============================================================================
create table if not exists public.delivery_neighborhoods (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  fee numeric(10,2) not null default 0,
  active boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.delivery_neighborhoods enable row level security;
drop policy if exists "Permitir leitura publica de delivery_neighborhoods" on public.delivery_neighborhoods;
create policy "Permitir leitura publica de delivery_neighborhoods"
  on public.delivery_neighborhoods for select
  to anon, authenticated
  using (true);

-- ============================================================================
-- 11. REALTIME (status da loja + catálogo público)
-- ============================================================================
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'store_settings',
    'pizzas',
    'drinks',
    'combos',
    'crust_options',
    'extra_ingredients',
    'delivery_neighborhoods'
  ] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = tbl
    ) then
      execute format('alter publication supabase_realtime add table public.%I', tbl);
    end if;
  end loop;
end $$;
