-- ============================================================
-- Qaryz — Friends, Friend Requests & Shared Debts
-- Run in Supabase SQL Editor AFTER 001_schema and 003_groups
-- ============================================================

-- 0. ADD PHONE TO PROFILES
-- ============================================================
alter table public.profiles add column if not exists phone text;

-- 1. FRIENDS (bidirectional)
-- ============================================================
-- Row exists only if both users are friends.
-- Inserted by the request acceptor.
create table if not exists public.friends (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  friend_id   uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique(user_id, friend_id),
  check (user_id <> friend_id)  -- can't friend yourself
);

-- 2. FRIEND REQUESTS
-- ============================================================
create table if not exists public.friend_requests (
  id          uuid primary key default gen_random_uuid(),
  sender_id   uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  status      text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique(sender_id, receiver_id),
  check (sender_id <> receiver_id)
);

-- 3. SHARED DEBTS (between system users — auto two-way sync)
-- ============================================================
create table if not exists public.shared_debts (
  id            uuid primary key default gen_random_uuid(),
  from_user_id  uuid not null references auth.users(id) on delete cascade,
  to_user_id    uuid not null references auth.users(id) on delete cascade,
  amount        numeric(12,2) not null check (amount > 0),
  description   text,
  created_by    uuid not null references auth.users(id),
  created_at    timestamptz not null default now(),
  settled_at    timestamptz,
  updated_at    timestamptz not null default now(),
  check (from_user_id <> to_user_id)
);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_friends_user  on public.friends(user_id);
create index if not exists idx_friends_friend on public.friends(friend_id);
create index if not exists idx_fr_sender   on public.friend_requests(sender_id);
create index if not exists idx_fr_receiver on public.friend_requests(receiver_id);
create index if not exists idx_sd_from     on public.shared_debts(from_user_id);
create index if not exists idx_sd_to       on public.shared_debts(to_user_id);
create index if not exists idx_sd_created  on public.shared_debts(from_user_id, created_at desc);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.friends enable row level security;
alter table public.friend_requests enable row level security;
alter table public.shared_debts enable row level security;

-- Friends: see if YOU are involved
create policy "Users can view own friendships"
  on public.friends for select
  using (auth.uid() = user_id or auth.uid() = friend_id);

create policy "Users can create friendships"
  on public.friends for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own friendships"
  on public.friends for delete
  using (auth.uid() = user_id or auth.uid() = friend_id);

-- Friend requests: sender and receiver can see
create policy "Users can view own requests"
  on public.friend_requests for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can send requests"
  on public.friend_requests for insert
  with check (auth.uid() = sender_id);

create policy "Receivers can update request status"
  on public.friend_requests for update
  using (auth.uid() = receiver_id);

-- Shared debts: both parties can see and update
create policy "Users can view shared debts"
  on public.shared_debts for select
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

create policy "Users can create shared debts"
  on public.shared_debts for insert
  with check (auth.uid() = created_by);

create policy "Both parties can update shared debts"
  on public.shared_debts for update
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

-- ============================================================
-- TRIGGERS
-- ============================================================
create trigger set_updated_at_friend_requests
  before update on public.friend_requests
  for each row execute function public.handle_updated_at();

create trigger set_updated_at_shared_debts
  before update on public.shared_debts
  for each row execute function public.handle_updated_at();
