-- =====================================================================
-- Migration 002 — Ajout de la colonne color_mode sur profiles
-- Phase 1bis : Fondation du système de design
-- Ajoute la colonne color_mode ('dark'/'light', défaut 'dark') à la table
-- profiles pour permettre aux utilisateurs de choisir le mode clair/sombre.
-- Conforme à NEYKRA_SPEC.md section 6 (Phase 1bis).
-- =====================================================================

alter table public.profiles
  add column if not exists color_mode text
    not null default 'dark'
    check (color_mode in ('dark', 'light'));