-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Gestores (linked to Supabase auth users)
create table public.gestores (
  id uuid references auth.users on delete cascade primary key,
  nome text not null,
  email text not null,
  telefone text,
  created_at timestamptz default now()
);
alter table public.gestores enable row level security;
create policy "Gestor vê só o próprio perfil" on public.gestores
  for all using (auth.uid() = id);

-- Programas de fidelidade (catálogo fixo)
create table public.programas (
  id serial primary key,
  nome text not null,
  companhia text not null,
  cor text not null default '#6366f1'
);
insert into public.programas (nome, companhia, cor) values
  ('LATAM Pass', 'LATAM Airlines', '#e3373c'),
  ('Smiles', 'GOL Linhas Aéreas', '#f97316'),
  ('TudoAzul', 'Azul Linhas Aéreas', '#2563eb'),
  ('Livelo', 'Livelo', '#8b5cf6'),
  ('Outro', 'Outros', '#6b7280');

-- Clientes de cada gestor
create table public.clientes (
  id uuid default uuid_generate_v4() primary key,
  gestor_id uuid references public.gestores(id) on delete cascade not null,
  nome text not null,
  email text,
  telefone text,
  cpf text,
  data_nascimento date,
  observacoes text,
  fee_mensal numeric(10,2) default 0,
  fee_por_emissao numeric(10,2) default 0,
  meta_economia numeric(12,2) default 0,
  ativo boolean default true,
  created_at timestamptz default now()
);
alter table public.clientes enable row level security;
create policy "Gestor vê só seus clientes" on public.clientes
  for all using (gestor_id = auth.uid());

-- Contas dos clientes em programas de fidelidade
create table public.contas_programas (
  id uuid default uuid_generate_v4() primary key,
  cliente_id uuid references public.clientes(id) on delete cascade not null,
  gestor_id uuid references public.gestores(id) on delete cascade not null,
  programa_id integer references public.programas(id) not null,
  numero_conta text,
  saldo_atual integer default 0,
  ultima_atualizacao_saldo timestamptz,
  created_at timestamptz default now()
);
alter table public.contas_programas enable row level security;
create policy "Gestor vê contas dos seus clientes" on public.contas_programas
  for all using (gestor_id = auth.uid());

-- Emissões de passagens
create table public.emissoes (
  id uuid default uuid_generate_v4() primary key,
  gestor_id uuid references public.gestores(id) on delete cascade not null,
  cliente_id uuid references public.clientes(id) on delete cascade not null,
  programa_id integer references public.programas(id),
  origem text not null,
  destino text not null,
  data_voo date not null,
  passageiros integer default 1,
  milhas_utilizadas integer not null default 0,
  preco_mercado numeric(10,2) not null default 0,
  taxas_pagas numeric(10,2) default 0,
  fee_cobrado numeric(10,2) default 0,
  economia numeric(10,2) generated always as (preco_mercado - taxas_pagas - fee_cobrado) stored,
  classe text default 'Econômica',
  status text default 'confirmada' check (status in ('confirmada', 'cancelada', 'pendente')),
  observacoes text,
  created_at timestamptz default now()
);
alter table public.emissoes enable row level security;
create policy "Gestor vê só suas emissões" on public.emissoes
  for all using (gestor_id = auth.uid());

-- Transações financeiras
create table public.transacoes (
  id uuid default uuid_generate_v4() primary key,
  gestor_id uuid references public.gestores(id) on delete cascade not null,
  cliente_id uuid references public.clientes(id),
  emissao_id uuid references public.emissoes(id),
  tipo text not null check (tipo in ('receita', 'despesa', 'fee_mensal', 'fee_emissao', 'compra_milhas')),
  descricao text not null,
  valor numeric(10,2) not null,
  data_vencimento date,
  data_pagamento date,
  pago boolean default false,
  created_at timestamptz default now()
);
alter table public.transacoes enable row level security;
create policy "Gestor vê só suas transações" on public.transacoes
  for all using (gestor_id = auth.uid());

-- Views úteis
create view public.resumo_clientes as
select
  c.id,
  c.gestor_id,
  c.nome,
  c.email,
  c.meta_economia,
  c.fee_mensal,
  c.ativo,
  coalesce(sum(e.economia) filter (where e.status = 'confirmada'), 0) as economia_total,
  coalesce(count(e.id) filter (where e.status = 'confirmada'), 0) as total_emissoes,
  coalesce(sum(e.milhas_utilizadas) filter (where e.status = 'confirmada'), 0) as total_milhas_usadas
from public.clientes c
left join public.emissoes e on e.cliente_id = c.id
group by c.id, c.gestor_id, c.nome, c.email, c.meta_economia, c.fee_mensal, c.ativo;
