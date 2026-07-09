-- ============================================================
-- Qaryz — Friend Search RLS Policy
-- Run in Supabase SQL Editor after 004_friends.sql
-- ============================================================

-- Allow authenticated users to search/read profiles for friend search
-- This is essential for the "Find friends" feature
create policy "Users can search profiles"
  on public.profiles for select
  using (auth.role() = 'authenticated');
