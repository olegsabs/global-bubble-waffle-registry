create extension if not exists pgcrypto;

do $$
begin
  create type public.agent_type as enum ('discovery', 'verification', 'enrichment', 'monitoring', 'expansion');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.agent_run_status as enum ('running', 'succeeded', 'failed', 'partial');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.discovery_ingestion_status as enum ('pending', 'promoted', 'rejected', 'duplicate');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.shop_media_type as enum ('image', 'menu', 'video', 'other');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  agent_type public.agent_type not null,
  run_key text unique,
  status public.agent_run_status not null default 'running',
  started_at timestamptz not null default timezone('utc', now()),
  finished_at timestamptz,
  input_payload jsonb not null default '{}'::jsonb,
  result_payload jsonb not null default '{}'::jsonb,
  processed_count integer not null default 0 check (processed_count >= 0),
  inserted_count integer not null default 0 check (inserted_count >= 0),
  updated_count integer not null default 0 check (updated_count >= 0),
  error_message text,
  created_by text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_agent_runs_agent_type_started_at on public.agent_runs (agent_type, started_at desc);
create index if not exists idx_agent_runs_status_started_at on public.agent_runs (status, started_at desc);
create index if not exists idx_agent_runs_started_at on public.agent_runs (started_at desc);

create table if not exists public.agent_discoveries (
  id uuid primary key default gen_random_uuid(),
  agent_run_id uuid references public.agent_runs(id) on delete set null,
  source text not null,
  external_ref text,
  source_url text,
  discovery_hash text not null unique,
  name text not null,
  country text not null,
  city text not null,
  address text not null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  instagram_url text,
  website_url text,
  format public.shop_format not null default 'unknown',
  status public.shop_status not null default 'unknown',
  discovery_confidence double precision not null default 0 check (discovery_confidence >= 0 and discovery_confidence <= 1),
  raw_payload jsonb not null default '{}'::jsonb,
  ingestion_status public.discovery_ingestion_status not null default 'pending',
  promoted_shop_id uuid references public.shops(id) on delete set null,
  discovered_at timestamptz not null default timezone('utc', now()),
  processed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_agent_discoveries_ingestion_status_discovered_at on public.agent_discoveries (ingestion_status, discovered_at desc);
create index if not exists idx_agent_discoveries_country_city on public.agent_discoveries (country, city);
create index if not exists idx_agent_discoveries_source on public.agent_discoveries (source);
create index if not exists idx_agent_discoveries_promoted_shop_id on public.agent_discoveries (promoted_shop_id);

create table if not exists public.shop_verification_logs (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  agent_run_id uuid references public.agent_runs(id) on delete set null,
  source text not null,
  previous_status public.shop_status,
  result_status public.shop_status not null,
  verification_confidence double precision not null check (verification_confidence >= 0 and verification_confidence <= 1),
  reason text,
  evidence jsonb not null default '{}'::jsonb,
  verified_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_shop_verification_logs_shop_id_verified_at on public.shop_verification_logs (shop_id, verified_at desc);
create index if not exists idx_shop_verification_logs_agent_run_id on public.shop_verification_logs (agent_run_id);
create index if not exists idx_shop_verification_logs_result_status on public.shop_verification_logs (result_status);

create table if not exists public.shop_media (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  media_type public.shop_media_type not null default 'image',
  storage_path text,
  source_url text,
  caption text,
  metadata jsonb not null default '{}'::jsonb,
  is_primary boolean not null default false,
  created_source public.shop_created_source not null default 'agent',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_shop_media_shop_id_created_at on public.shop_media (shop_id, created_at desc);
create index if not exists idx_shop_media_shop_id_is_primary on public.shop_media (shop_id, is_primary) where is_primary = true;

create index if not exists idx_shops_latitude_longitude on public.shops (latitude, longitude);

drop trigger if exists trg_agent_runs_set_updated_at on public.agent_runs;
create trigger trg_agent_runs_set_updated_at
before update on public.agent_runs
for each row
execute procedure public.set_updated_at();

drop trigger if exists trg_agent_discoveries_set_updated_at on public.agent_discoveries;
create trigger trg_agent_discoveries_set_updated_at
before update on public.agent_discoveries
for each row
execute procedure public.set_updated_at();

drop trigger if exists trg_shop_media_set_updated_at on public.shop_media;
create trigger trg_shop_media_set_updated_at
before update on public.shop_media
for each row
execute procedure public.set_updated_at();

alter table public.agent_runs enable row level security;
alter table public.agent_discoveries enable row level security;
alter table public.shop_verification_logs enable row level security;
alter table public.shop_media enable row level security;

drop policy if exists "Public can read shop media" on public.shop_media;
create policy "Public can read shop media"
on public.shop_media
for select
using (true);
