-- ============================================================
-- Qaryz — Groups & Expense Splitting
-- Run in Supabase SQL Editor AFTER 001_schema and 002_storage
-- ============================================================

-- 1. GROUPS
-- ============================================================
create table if not exists public.groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  emoji       text default '👥',
  created_by  uuid not null references auth.users(id) on delete cascade,
  invite_code text unique not null default substr(gen_random_uuid()::text, 1, 6),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 2. GROUP MEMBERS
-- ============================================================
create table if not exists public.group_members (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.groups(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  nickname   text,
  joined_at  timestamptz not null default now(),
  unique(group_id, user_id)
);

-- 3. EXPENSES
-- ============================================================
create table if not exists public.expenses (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references public.groups(id) on delete cascade,
  paid_by     uuid not null references auth.users(id),
  amount      numeric(12,2) not null check (amount > 0),
  description text not null,
  category    text default 'other',
  split_mode  text not null default 'equal' check (split_mode in ('equal', 'custom')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 4. EXPENSE SHARES
-- ============================================================
create table if not exists public.expense_shares (
  id           uuid primary key default gen_random_uuid(),
  expense_id   uuid not null references public.expenses(id) on delete cascade,
  user_id      uuid not null references auth.users(id),
  share_amount numeric(12,2) not null check (share_amount > 0),
  settled      boolean not null default false,
  unique(expense_id, user_id)
);

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_groups_created_by on public.groups(created_by);
create index idx_group_members_group on public.group_members(group_id);
create index idx_group_members_user on public.group_members(user_id);
create index idx_expenses_group on public.expenses(group_id);
create index idx_expenses_group_created on public.expenses(group_id, created_at desc);
create index idx_expense_shares_expense on public.expense_shares(expense_id);
create index idx_expense_shares_user on public.expense_shares(user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_shares enable row level security;

-- Groups: members can view, creator can update/delete
create policy "Members can view groups"
  on public.groups for select
  using (
    auth.uid() = created_by
    or auth.uid() in (
      select user_id from public.group_members where group_id = id
    )
  );

create policy "Users can create groups"
  on public.groups for insert
  with check (auth.uid() = created_by);

create policy "Creator can update group"
  on public.groups for update
  using (auth.uid() = created_by);

create policy "Creator can delete group"
  on public.groups for delete
  using (auth.uid() = created_by);

-- Group members: members can view, anyone can join by invite
create policy "Members can view group members"
  on public.group_members for select
  using (
    group_id in (
      select gm.group_id from public.group_members gm
      where gm.user_id = auth.uid()
    )
    or user_id = auth.uid()
  );

create policy "Users can join groups"
  on public.group_members for insert
  with check (auth.uid() = user_id);

create policy "Users can leave groups"
  on public.group_members for delete
  using (auth.uid() = user_id);

-- Expenses: group members can CRUD
create policy "Members can view expenses"
  on public.expenses for select
  using (
    group_id in (
      select group_id from public.group_members where user_id = auth.uid()
    )
  );

create policy "Members can create expenses"
  on public.expenses for insert
  with check (
    group_id in (
      select group_id from public.group_members where user_id = auth.uid()
    )
  );

create policy "Payer can update expense"
  on public.expenses for update
  using (auth.uid() = paid_by);

create policy "Payer can delete expense"
  on public.expenses for delete
  using (auth.uid() = paid_by);

-- Expense shares: group members can view
create policy "Members can view expense shares"
  on public.expense_shares for select
  using (
    expense_id in (
      select e.id from public.expenses e
      join public.group_members gm on gm.group_id = e.group_id
      where gm.user_id = auth.uid()
    )
  );

create policy "Members can create expense shares"
  on public.expense_shares for insert
  with check (
    expense_id in (
      select e.id from public.expenses e
      join public.group_members gm on gm.group_id = e.group_id
      where gm.user_id = auth.uid()
    )
  );

create policy "Members can update shares"
  on public.expense_shares for update
  using (
    expense_id in (
      select e.id from public.expenses e
      join public.group_members gm on gm.group_id = e.group_id
      where gm.user_id = auth.uid()
    )
  );

-- ============================================================
-- TRIGGERS
-- ============================================================
create trigger set_updated_at_groups
  before update on public.groups
  for each row execute function public.handle_updated_at();

create trigger set_updated_at_expenses
  before update on public.expenses
  for each row execute function public.handle_updated_at();
