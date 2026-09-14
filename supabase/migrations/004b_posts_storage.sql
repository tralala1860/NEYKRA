-- =====================================================================
-- Migration 004b — Bucket Storage "posts" (Phase 2, étape 2 : fil d'actualite)
--
-- Bucket public (lecture ouverte : les medias des posts s'affichent dans le
-- fil d'actualite), ecriture reservee au proprietaire du post
-- (chemin <userId>/...).
--
-- Exécution : coller ce fichier dans le SQL Editor du dashboard Supabase.
-- Idempotent : ré-exécutable sans erreur (ON CONFLICT / DROP IF EXISTS).
-- =====================================================================

-- 1. Bucket public "posts"
insert into storage.buckets (id, name, public)
values ('posts', 'posts', true)
on conflict (id) do update set public = true;

-- 2. Politiques d'accès
-- Lecture publique (medias visibles dans le fil d'actualite).
drop policy if exists "posts_public_read" on storage.objects;
create policy "posts_public_read"
  on storage.objects for select
  using (bucket_id = 'posts');

-- Insertion : uniquement dans son propre dossier <userId>/...
drop policy if exists "posts_insert_own" on storage.objects;
create policy "posts_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'posts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Mise à jour : uniquement son propre dossier.
drop policy if exists "posts_update_own" on storage.objects;
create policy "posts_update_own"
  on storage.objects for update
  using (
    bucket_id = 'posts'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'posts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Suppression : uniquement son propre dossier.
drop policy if exists "posts_delete_own" on storage.objects;
create policy "posts_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'posts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
