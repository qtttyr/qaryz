-- ============================================================
-- Qaryz — Database Schema
-- Supabase Migration 001
-- ============================================================

-- 0. EXTENSIONS
-- ============================================================
create extension if not exists "pgcrypto" with schema extensions;

-- 1. PROFILES (extends auth.users)
-- ============================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null default 'Пользователь',
  username    text unique,
  avatar_url  text,
  currency    text not null default 'KZT' check (currency in ('KZT', 'RUB', 'USD')),
  language    text not null default 'ru' check (language in ('ru', 'en')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 2. PERSONS
-- ============================================================
create table if not exists public.persons (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  avatar_url  text,
  phone       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 3. DEBTS
-- ============================================================
create table if not exists public.debts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  person_id   uuid not null references public.persons(id) on delete cascade,
  direction   text not null check (direction in ('owed_to_me', 'i_owe')),
  amount      numeric(12,2) not null check (amount > 0),
  description text,
  created_at  timestamptz not null default now(),
  settled_at  timestamptz,
  updated_at  timestamptz not null default now()
);

-- 4. PAYMENTS
-- ============================================================
create table if not exists public.payments (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  debt_id     uuid not null references public.debts(id) on delete cascade,
  amount      numeric(12,2) not null check (amount > 0),
  note        text,
  type        text not null check (type in ('partial', 'full')),
  created_at  timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_persons_user_id on public.persons(user_id);
create index idx_persons_user_name on public.persons(user_id, name);

create index idx_debts_user_id on public.debts(user_id);
create index idx_debts_person on public.debts(user_id, person_id);
create index idx_debts_direction on public.debts(user_id, direction);
create index idx_debts_created on public.debts(user_id, created_at desc);
create index idx_debts_active on public.debts(user_id) where settled_at is null;

create index idx_payments_debt on public.payments(debt_id);
create index idx_payments_created on public.payments(debt_id, created_at desc);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.persons enable row level security;
alter table public.debts enable row level security;
alter table public.payments enable row level security;

-- Profiles: user can read/edit own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Persons: user can CRUD their own persons
create policy "Users can view own persons"
  on public.persons for select
  using (auth.uid() = user_id);

create policy "Users can create persons"
  on public.persons for insert
  with check (auth.uid() = user_id);

create policy "Users can update own persons"
  on public.persons for update
  using (auth.uid() = user_id);

create policy "Users can delete own persons"
  on public.persons for delete
  using (auth.uid() = user_id);

-- Debts: user can CRUD their own debts
create policy "Users can view own debts"
  on public.debts for select
  using (auth.uid() = user_id);

create policy "Users can create debts"
  on public.debts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own debts"
  on public.debts for update
  using (auth.uid() = user_id);

create policy "Users can delete own debts"
  on public.debts for delete
  using (auth.uid() = user_id);

-- Payments: user can CRUD their own payments
create policy "Users can view own payments"
  on public.payments for select
  using (auth.uid() = user_id);

create policy "Users can create payments"
  on public.payments for insert
  with check (auth.uid() = user_id);

create policy "Users can update own payments"
  on public.payments for update
  using (auth.uid() = user_id);

create policy "Users can delete own payments"
  on public.payments for delete
  using (auth.uid() = user_id);

-- ============================================================
-- TRIGGER: Auto-create profile on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, name, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', 'Пользователь'),
    coalesce(new.raw_user_meta_data ->> 'username', 'user_' || substr(new.id::text, 1, 8))
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- TRIGGER: Auto-update updated_at
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at_profiles
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger set_updated_at_persons
  before update on public.persons
  for each row execute function public.handle_updated_at();

create trigger set_updated_at_debts
  before update on public.debts
  for each row execute function public.handle_updated_at();
