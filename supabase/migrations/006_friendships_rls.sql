-- =====================================================================
-- NEYKRA — Migration 006 : RLS friendships (acceptation par le destinataire)
--
-- Contexte : la policy d'origine « friendships_update_participant »
-- autorisait les DEUX parties à modifier la ligne
-- (using user_id = auth.uid() or friend_id = auth.uid()). Le DEMANDEUR
-- pouvait donc passer sa propre demande en 'accepted' en appelant l'API
-- REST directement, sans le consentement du destinataire — une amitié
-- acceptée débloque `is_accepted_friend` (visibilité des posts, profils
-- privés, messagerie) : la faille était donc réelle.
--
-- Seul le DESTINATAIRE (friend_id) doit pouvoir accepter une demande.
-- Les autres besoins restent couverts par les policies existantes :
--   * créer une demande ...................... friendships_insert_own
--                                               (with check user_id = auth.uid())
--   * voir les demandes qui me concernent ..... friendships_select
--                                               (user_id = auth.uid() or friend_id = auth.uid())
--   * refuser / annuler sa demande / retirer .. friendships_delete_participant
--                                               (les deux parties)
--
-- Idempotente : ré-exécutable sans erreur.
-- À EXÉCUTER dans le SQL Editor Supabase (comme les autres migrations).
-- =====================================================================

drop policy if exists "friendships_update_participant" on public.friendships;

create policy "friendships_update_recipient" on public.friendships
  for update using (friend_id = auth.uid())
  with check (friend_id = auth.uid());