# CHANGELOG — NEYKRA

> À mettre à jour à la fin de chaque session de développement (Claude Code, Cline ou autre).
> Format : date, ce qui a été fait, ce qui reste à faire / bugs connus.

## [13/09/2026] — Session 1 — Phase 0 : Fondations
- **Réorganisation** : le dossier `Desktop\NEYKRA` (qui ne contenait que les 2 docs) est devenu la racine propre du projet — docs + code réunis au même endroit, rien ailleurs. *(Un dossier frère nommé "NEYKRA" est impossible : collision de nom.)*
- **Git** : dépôt initialisé (`git init -b main`), premier commit effectué — voir historique git.
- **Next.js 16.3.5** (App Router, TypeScript, Tailwind CSS v4, ESLint) scaffoldé à la racine, build validé (`npm run build` ✓ : compilation + TypeScript OK).
- **Supabase** : package `@supabase/supabase-js@2.116.0` installé, client créé dans `src/lib/supabase/client.ts`, variables dans `.env.local` (gitignoré) + gabarit `.env.example` (committé).
- **Schéma SQL** : `supabase/schema.sql` complet et conforme à NEYKRA_SPEC.md §4 — les 14 tables (`profiles`, `posts`, `likes`, `comments`, `friendships`, `conversations`, `conversation_participants`, `messages`, `notifications`, `blocks`, `quotes`, `otaku_status`, `quiz_questions`, `quiz_attempts`) + index + fonctions (`is_accepted_friend`, `is_blocked`, `post_visible_to_reader`) + trigger `on_auth_user_created` (profil auto à l'inscription).
- **RLS** : activation + politiques de base conformes à NEYKRA_SPEC.md §5 sur toutes les tables.
- **Framer Motion 13.2.0** installé (pas encore utilisé, réservé aux phases suivantes).
- **README.md** réécrit pour NEYKRA.

## Ce qui reste à faire (Phase 0 non terminée)
- Créer le projet **Supabase** (dashboard) puis remplir `.env.local` avec l'URL et la clé anon réelles.
- Exécuter `supabase/schema.sql` dans le SQL Editor de Supabase.
- Créer le dépôt **GitHub** distant (authentification requise) et `git push`.
- Vérifier le bon fonctionnement de RLS une fois le projet Supabase branché.

## Bugs / points d'attention connus
- Aucun bug bloquant. Terminal Windows capricieux pour les sorties longues (scaffold/install) — résolu par logs redirigés.
- `quiz_questions` en lecture RLS ouverte (anti-triche géré en logique métier en Phase 6).