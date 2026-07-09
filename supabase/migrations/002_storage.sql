-- ============================================================
-- Qaryz — Storage Bucket for Avatars
-- Run this in Supabase SQL Editor AFTER the first migration
-- ============================================================

-- 1. Create avatars bucket (public read, private write)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,                       -- public read (anyone can view avatars)
  2097152,                    -- 2 MB limit
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- 2. RLS: anyone can read avatars (they're public)
create policy "Anyone can view avatars"
on storage.objects for select
using (bucket_id = 'avatars');

-- 3. RLS: authenticated users can upload their own avatars
create policy "Users can upload their own avatars"
on storage.objects for insert
with check (
  bucket_id = 'avatars'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. RLS: users can update their own avatars
create policy "Users can update their own avatars"
on storage.objects for update
using (
  bucket_id = 'avatars'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. RLS: users can delete their own avatars
create policy "Users can delete their own avatars"
on storage.objects for delete
using (
  bucket_id = 'avatars'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);
