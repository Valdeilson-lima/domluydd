-- Schema do Supabase para Don Luydd Pizzaria
-- Execute este script no SQL Editor do painel do Supabase

-- 1. Cria a tabela de pedidos
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
  notes text
);

-- 2. Habilita Row Level Security (RLS)
alter table public.orders enable row level security;

-- 3. Políticas de acesso:
-- Permite que clientes criem novos pedidos
create policy "Permitir criacao de pedidos"
  on public.orders for insert
  with check (true);

-- Permite leitura dos pedidos (pelo painel da cozinha e página de acompanhamento)
create policy "Permitir leitura de pedidos"
  on public.orders for select
  using (true);

-- Permite atualizar status dos pedidos (cozinha avançando status)
create policy "Permitir atualizacao de pedidos"
  on public.orders for update
  using (true);

-- 4. Habilita Realtime para que a cozinha receba pedidos instantaneamente via WebSockets
alter publication supabase_realtime add table public.orders;

-- 5. Cria a tabela de configurações da loja (aberto/fechado, aviso aos clientes)
create table if not exists public.store_settings (
  id text primary key default 'main',
  is_open boolean not null default false,
  mode text not null default 'auto', -- 'auto' | 'open' | 'closed'
  custom_message text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilita Row Level Security (RLS)
alter table public.store_settings enable row level security;

-- Políticas de acesso para store_settings:
create policy "Permitir leitura de store_settings"
  on public.store_settings for select
  using (true);

create policy "Permitir insercao de store_settings"
  on public.store_settings for insert
  with check (true);

create policy "Permitir atualizacao de store_settings"
  on public.store_settings for update
  using (true);

-- Insere linha inicial de configuração
insert into public.store_settings (id, mode, is_open, custom_message)
values ('main', 'auto', false, null)
on conflict (id) do nothing;

-- Habilita Realtime para sincronização instantânea do status entre Admin e Clientes
alter publication supabase_realtime add table public.store_settings;

