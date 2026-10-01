-- Run this in Supabase SQL editor

-- Add image_url column to products
alter table public.products add column if not exists image_url text;

-- Create storage bucket for product images (public = anyone can view URLs)
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Storage policies
create policy "Public read product images" on storage.objects
  for select using (bucket_id = 'product-images');

create policy "Admins upload product images" on storage.objects
  for insert with check (
    bucket_id = 'product-images' and auth.uid() is not null
  );

create policy "Admins update product images" on storage.objects
  for update using (
    bucket_id = 'product-images' and auth.uid() is not null
  );

create policy "Admins delete product images" on storage.objects
  for delete using (
    bucket_id = 'product-images' and auth.uid() is not null
  );
