-- =====================================================================
-- Migration 003 — Système 5 univers (remplace 3 thèmes × 2 modes)
-- Conforme à NEYKRA_SPEC.md section 6.
--
--  - Ancien système : theme_preference ('shonen'/'seinen'/'kawaii')
--    + color_mode ('dark'/'light')
--  - Nouveau système : theme_preference
--    ('void'/'neon_tokyo'/'sakura'/'inferno'/'zen'), chaque univers a un
--    mode de couleur fixe (plus de toggle dark/light séparé).
--
-- Ordre d'exécution important :
--   1. Supprimer l'ancienne contrainte CHECK (sinon les nouvelles valeurs
--      seraient rejetées, et les anciennes bloqueraient la nouvelle).
--   2. Migrer les données existantes.
--   3. Poser le défaut 'void' + la nouvelle contrainte CHECK.
--   4. Supprimer la colonne color_mode devenue inutile.
--
-- Exécution : coller ce fichier dans le SQL Editor du dashboard Supabase
-- (ou via Supabase CLI : supabase db push). Idempotent : ré-exécutable
-- sans erreur (IF EXISTS / DO blocks).
-- =====================================================================

-- 1. Supprimer l'ancienne contrainte CHECK sur theme_preference -----------
-- Nom auto-généré par schema.sql inline : profiles_theme_preference_check.
-- On supprime aussi tout CHECK résiduel mentionnant theme_preference
-- (robustesse si le nom diffère selon l'historique : 001, 002, exécutions
-- manuelles du schema.sql).
alter table public.profiles
  drop constraint if exists profiles_theme_preference_check;

do $$
declare
  r record;
begin
  for r in
    select conname
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%theme_preference%'
  loop
    execute format('alter table public.profiles drop constraint if exists %I', r.conname);
  end loop;
end
$$;

-- 2. Migration des données existantes ------------------------------------
-- shonen → inferno, seinen → void, kawaii → sakura.
-- Toute valeur résiduelle inattendue (NULL impossible car NOT NULL, mais
-- valeur hors-liste si contrainte contournée) → 'void' (défaut sûr).
update public.profiles
set theme_preference = case theme_preference
  when 'shonen' then 'inferno'
  when 'seinen' then 'void'
  when 'kawaii' then 'sakura'
  when 'void' then 'void'
  when 'neon_tokyo' then 'neon_tokyo'
  when 'sakura' then 'sakura'
  when 'inferno' then 'inferno'
  when 'zen' then 'zen'
  else 'void'
end
where theme_preference is distinct from case theme_preference
  when 'shonen' then 'inferno'
  when 'seinen' then 'void'
  when 'kawaii' then 'sakura'
  else theme_preference
end
   or theme_preference not in ('void', 'neon_tokyo', 'sakura', 'inferno', 'zen');

-- Sécurité : attrape-tout si des valeurs hors-liste subsistent.
update public.profiles
set theme_preference = 'void'
where theme_preference not in ('void', 'neon_tokyo', 'sakura', 'inferno', 'zen');

-- 3. Défaut 'void' pour les nouvelles inscriptions -----------------------
-- Le trigger handle_new_user_auth() n'insère pas theme_preference
-- explicitement → c'est ce DEFAULT qui s'applique aux nouveaux comptes.
alter table public.profiles
  alter column theme_preference set default 'void';

-- 4. Nouvelle contrainte CHECK : les 5 univers ---------------------------
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_theme_preference_universe_check'
  ) then
    alter table public.profiles
      add constraint profiles_theme_preference_universe_check
      check (theme_preference in ('void', 'neon_tokyo', 'sakura', 'inferno', 'zen'));
  end if;
end
$$;

-- 5. Supprimer la colonne color_mode (mode fixe par univers) -------------
-- D'abord sa contrainte CHECK si elle existe encore sous son nom
-- auto-généré, puis la colonne elle-même.
alter table public.profiles
  drop constraint if exists profiles_color_mode_check;

do $$
declare
  r record;
begin
  for r in
    select conname
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%color_mode%'
  loop
    execute format('alter table public.profiles drop constraint if exists %I', r.conname);
  end loop;
end
$$;

alter table public.profiles
  drop column if exists color_mode;
