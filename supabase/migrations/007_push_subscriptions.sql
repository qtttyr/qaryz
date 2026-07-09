-- ============================================================
-- Qaryz — Push Subscriptions & Notification History
-- Run in Supabase SQL Editor AFTER 006_shared_debt_paid.sql
-- ============================================================

-- 1. PUSH SUBSCRIPTIONS
-- ============================================================
-- Stores browser push subscription data for each user.
-- Each subscription is uniquely identified by (user_id, endpoint).
create table if not exists public.push_subscriptions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  endpoint      text not null,
  p256dh_key    text not null,
  auth_key      text not null,
  user_agent    text,
  created_at    timestamptz not null default now(),
  unique(user_id, endpoint)
);

-- 2. NOTIFICATIONS (history)
-- ============================================================
-- Stores a log of all notifications sent to users for in-app history.
create table if not exists public.notifications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  title         text not null,
  body          text not null,
  data          jsonb,
  source_type   text,  -- 'shared_debt' | 'payment' | 'reminder' | 'system'
  source_id     text,
  tag           text,  -- dedup tag for service worker
  delivered     boolean not null default false,
  read          boolean not null default false,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_push_subscriptions_user
  on public.push_subscriptions(user_id);
create index if not exists idx_notifications_user
  on public.notifications(user_id, created_at desc);
create index if not exists idx_notifications_unread
  on public.notifications(user_id) where read = false;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.push_subscriptions enable row level security;
alter table public.notifications enable row level security;

-- Push Subscriptions: user manages own subscriptions
drop policy if exists "Users can view own subscriptions" on public.push_subscriptions;
create policy "Users can view own subscriptions"
  on public.push_subscriptions for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create own subscriptions" on public.push_subscriptions;
create policy "Users can create own subscriptions"
  on public.push_subscriptions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own subscriptions" on public.push_subscriptions;
create policy "Users can delete own subscriptions"
  on public.push_subscriptions for delete
  using (auth.uid() = user_id);

-- Notifications: user can view, system can insert
drop policy if exists "Users can view own notifications" on public.notifications;
create policy "Users can view own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists "System can insert notifications" on public.notifications;
create policy "System can insert notifications"
  on public.notifications for insert
  with check (
    -- Regular users: insert only own notifications
    -- Service role (from edge functions): can insert for any user
    user_id = auth.uid() OR auth.role() = 'service_role'
  );

drop policy if exists "Users can mark notifications as read" on public.notifications;
create policy "Users can mark notifications as read"
  on public.notifications for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own notifications" on public.notifications;
create policy "Users can delete own notifications"
  on public.notifications for delete
  using (auth.uid() = user_id);

-- ============================================================
-- RPC FUNCTIONS (SECURITY DEFINER — bypass RLS for reliability)
-- ============================================================

-- Upsert a push subscription for the current user
create or replace function public.upsert_push_subscription(
  p_endpoint text,
  p_p256dh_key text,
  p_auth_key text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.push_subscriptions (user_id, endpoint, p256dh_key, auth_key)
  values (auth.uid(), p_endpoint, p_p256dh_key, p_auth_key)
  on conflict (user_id, endpoint)
  do update set
    p256dh_key = excluded.p256dh_key,
    auth_key = excluded.auth_key,
    user_agent = current_setting('request.headers')::json->>'user-agent';
end;
$$;

-- Remove push subscription for the current user
create or replace function public.remove_push_subscription(
  p_endpoint text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_endpoint is not null then
    delete from public.push_subscriptions
    where user_id = auth.uid() and endpoint = p_endpoint;
  else
    delete from public.push_subscriptions
    where user_id = auth.uid();
  end if;
end;
$$;
