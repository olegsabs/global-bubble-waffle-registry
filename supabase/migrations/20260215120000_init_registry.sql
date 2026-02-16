create extension if not exists pgcrypto;

do $$
begin
  create type public.shop_status as enum ('active', 'closed', 'unknown');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.shop_format as enum ('kiosk', 'cafe', 'truck', 'restaurant', 'unknown');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.shop_created_source as enum ('manual', 'submission', 'agent');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  country text not null,
  city text not null,
  address text not null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  instagram_url text,
  website_url text,
  status public.shop_status not null default 'unknown',
  format public.shop_format not null default 'unknown',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  last_verified_at timestamptz,
  created_source public.shop_created_source not null default 'manual',
  verification_confidence double precision not null default 0 check (verification_confidence >= 0 and verification_confidence <= 1)
);

create index if not exists idx_shops_slug on public.shops (slug);
create index if not exists idx_shops_country on public.shops (country);
create index if not exists idx_shops_city on public.shops (city);
create index if not exists idx_shops_status on public.shops (status);

create table if not exists public.shop_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text not null,
  city text not null,
  address text not null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  instagram_url text,
  website_url text,
  format public.shop_format not null default 'unknown',
  submitted_by_email text,
  source_note text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  reviewed_at timestamptz,
  reviewed_by uuid
);

create index if not exists idx_shop_submissions_status on public.shop_submissions (status);
create index if not exists idx_shop_submissions_created_at on public.shop_submissions (created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_shops_set_updated_at on public.shops;
create trigger trg_shops_set_updated_at
before update on public.shops
for each row
execute procedure public.set_updated_at();

drop trigger if exists trg_shop_submissions_set_updated_at on public.shop_submissions;
create trigger trg_shop_submissions_set_updated_at
before update on public.shop_submissions
for each row
execute procedure public.set_updated_at();

alter table public.shops enable row level security;
alter table public.shop_submissions enable row level security;

drop policy if exists "Public can read shops" on public.shops;
create policy "Public can read shops"
on public.shops
for select
using (true);

drop policy if exists "Public can submit shops" on public.shop_submissions;
create policy "Public can submit shops"
on public.shop_submissions
for insert
with check (true);
