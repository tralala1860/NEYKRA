-- =====================================================================
-- NEYKRA — Migration 007 : système de blocage — RLS complète
--          (spec §5 : aucune interaction si blocage dans un sens ou
--          l'autre ; l'utilisateur doit pouvoir se débloquer lui-même).
--
-- Les DEUX trous RLS corrigés ici (audit de supabase/schema.sql) :
--
--   TROU 1 — AUCUNE policy DELETE sur public.blocks (§6.9 : select +
--     insert uniquement) → unblockUser était bloqué par la RLS
--     (0 ligne supprimée, sans erreur PostgREST — même piège que
--     acceptFriendRequest en session 11). Un utilisateur ne pouvait
--     JAMAIS se débloquer de sa propre relation de blocage.
--     → policy blocks_delete_own (blocker_id = auth.uid()) : seul le
--       bloqueur supprime sa ligne (le bloqué ne peut pas forcer
--       l'oubli d'un blocage qu'il subit).
--
--   TROU 2 — profiles_select masque les profils bloqués dans les deux
--     sens (gardes not is_blocked), y compris pour le BLOQUEUR
--     lui-même : impossible d'afficher la liste « mes utilisateurs
--     bloqués » avec username/display_name/avatar_url.
--     → policy additive profiles_select_blocked_by_me : le bloqueur
--       voit le profil de quelqu'un qu'IL a bloqué (permissive → OR
--       avec profiles_select). Le bloqué, lui, ne voit toujours rien.
--
-- Constat préalable (déjà existant, rien à créer) :
--   * Table public.blocks (id, blocker_id, blocked_id, created_at,
--     unique (blocker_id, blocked_id), check (blocker_id <> blocked_id))
--     EXISTE (§2, lignes 112-120).
--   * Fonction public.is_blocked(target uuid) EXISTE (§4, lignes
--     196-209) en version 1 argument (lecteur courant = auth.uid()
--     implicite) : security definer, stable, les deux sens. On la
--     RÉUTILISE telle quelle — PAS de doublon à 2 arguments.
--   * public.post_visible_to_reader(target_post uuid) EXISTE (§6,
--     lignes 308-328) et public.comments_select DÉLÈGUE entièrement
--     (for select using (public.post_visible_to_reader(post_id))) —
--     rien à ajouter côté comments.
--   * posts_select (§6.2) et profiles_select (§6.1) ne filtraient le
--     blocage que sur la branche « profil public », PAS sur la branche
--     « ami accepté » : un bloqué resté ami (ligne friendships non
--     supprimée, donnée legacy) restait visible. Recréées ici avec la
--     même garde sur les deux branches.
--   * Messages/conversations : VOLONTAIREMENT inchangés (Phase 4 pas
--     codée, hors périmètre — suivi conservé pour plus tard).
--
-- Idempotente : ré-exécutable sans erreur (drop policy if exists +
-- create or replace function).
-- À EXÉCUTER dans le SQL Editor Supabase (comme les autres migrations) :
--   copier-coller l'intégralité de ce fichier, Run, vérifier
--   « Success. No rows returned ».
-- Puis reporter les mêmes blocs dans supabase/schema.sql (§6.x) pour
-- garder le schéma de référence synchrone (cf. incident trigger S08).
-- =====================================================================

-- 1. [TROU 1] DELETE sur blocks : seul le bloqueur peut débloquer -----
drop policy if exists "blocks_delete_own" on public.blocks;

create policy "blocks_delete_own" on public.blocks
  for delete using (blocker_id = auth.uid());

-- 2. post_visible_to_reader : un post d'un bloqué n'est plus visible,
--    MÊME si une amitié acceptée subsiste (ligne legacy / course) -----
create or replace function public.post_visible_to_reader(target_post uuid)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.posts p
    where p.id = target_post
      and (
        p.author_id = auth.uid()
        or (public.is_accepted_friend(p.author_id)
            and not public.is_blocked(p.author_id))
        or (exists (
              select 1 from public.profiles pr
              where pr.id = p.author_id and pr.is_private = false
            )
            and not public.is_blocked(p.author_id))
      )
  );
$$;

-- 3. posts_select : même garde anti-bloc sur la branche ami ------------
drop policy if exists "posts_select" on public.posts;

create policy "posts_select" on public.posts
  for select using (
    author_id = auth.uid()
    or (public.is_accepted_friend(author_id)
        and not public.is_blocked(author_id))
    or (exists (
          select 1 from public.profiles p
          where p.id = author_id and p.is_private = false
        )
        and not public.is_blocked(author_id))
  );

-- 4. profiles_select : même garde anti-bloc sur la branche ami ---------
drop policy if exists "profiles_select" on public.profiles;

create policy "profiles_select" on public.profiles
  for select using (
    id = auth.uid()
    or (public.is_accepted_friend(id)
        and not public.is_blocked(id))
    or (is_private = false and not public.is_blocked(id))
  );

-- 5. [TROU 2] Le bloqueur voit les profils qu'IL a bloqués -------------
--    Policy ADDITIVE (permissive → OR avec profiles_select, qu'on ne
--    remplace pas ici au-delà de la garde reprise en 4). Nécessaire
--    uniquement pour que getBlockedUsers() affiche username /
--    display_name / avatar_url des comptes bloqués.
drop policy if exists "profiles_select_blocked_by_me" on public.profiles;

create policy "profiles_select_blocked_by_me" on public.profiles
  for select using (
    exists (
      select 1 from public.blocks b
      where b.blocker_id = auth.uid() and b.blocked_id = profiles.id
    )
  );