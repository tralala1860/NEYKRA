-- =====================================================================
-- Migration 004 — Bucket Storage "avatars" (Phase 2, étape 1 : profil)
--
-- Bucket public (lecture ouverte : les avatars s'affichent sur les profils
-- publics), écriture réservée au propriétaire (chemin <userId>/...).
--
-- Exécution : coller ce fichier dans le SQL Editor du dashboard Supabase.
-- Idempotent : ré-exécutable sans erreur (ON CONFLICT / DROP IF EXISTS).
-- =====================================================================

-- 1. Bucket public "avatars" ---------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- 2. Politiques d'accès ---------------------------------------------------
-- Lecture publique (avatars visibles sur les profils publics).
drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Insertion : uniquement dans son propre dossier <userId>/...
drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Mise à jour : uniquement son propre dossier.
drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Suppression : uniquement son propre dossier.
drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
