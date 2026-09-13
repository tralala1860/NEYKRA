# CHANGELOG — NEYKRA

> À mettre à jour à la fin de chaque session de développement (Claude Code, Cline ou autre).
> Format : date, ce qui a été fait, ce qui reste à faire / bugs connus.

## [13/09/2026] — Session 2 — Phase 1 : Authentification
- **Dépendance** : `@supabase/ssr@0.12.7` ajouté (session cookies compatible SSR).
- **Clients Supabase** : `src/lib/supabase/client.ts` basculé sur `createBrowserClient` (SSR) + nouveau `src/lib/supabase/server.ts` (`createServerClient`, un par requête).
- **Inscription `/signup`** : formulaire (email, mot de passe, username, date de naissance **obligatoire**) + Server Action `signUp`. Validation serveur en français : champs manquants, email invalide, mot de passe < 6 caractères, username 3‑30 caractères (`[a-zA-Z0-9_]`), date de naissance invalide / future / avant 1900. Erreurs Supabase traduites (« email déjà utilisé », « email non confirmé », rate limit…).
- **Compte + profil** : `supabase.auth.signUp` avec `options.data` (username, birthdate) puis complétion de `profiles` (username, birthdate, is_minor, is_private). `is_minor` = moins de 18 ans à la date du jour (majorité au 18e anniversaire ; né le 29/02 → majorité le 28/02), calculé en TS (`src/lib/auth/age.ts`) **et** en SQL (`public.compute_is_minor`) — jamais de confiance en la valeur du client. `is_private = is_minor` (comptes mineurs privés par défaut).
- **Trigger enrichi** (`handle_new_user_auth` dans `supabase/schema.sql`) : lit `username` + `birthdate` depuis `raw_user_meta_data` et remplit `profiles` dès la création du compte auth → l'inscription fonctionne aussi avec **confirmation d'email activée** (pas de session immédiate).
- **Connexion `/login`** : `signInWithPassword`, redirection vers `/feed`, bannière de confirmation après le lien email (`/login?confirmed=1`).
- **Protection de route** : `src/proxy.ts` (ex-middleware Next.js 16) — refresh de session + `/feed` → `/login` (non connecté), `/login`/`/signup` → `/feed` (déjà connecté). La page `/feed` re-vérifie la session côté serveur.
- **Déconnexion** : bouton « Se déconnecter » dans l'en-tête de `/feed` (Server Action `signOut`).
- **Page d'accueil `/`** : landing minimal (Se connecter / Créer un compte) ; redirige vers `/feed` si déjà connecté.
- **Qualité** : `npm run lint` ✓, `npm run build` ✓ (compilation + TypeScript OK).

## [13/09/2026] — Session 1 — Phase 0 : Fondations
- **Réorganisation** : le dossier `Desktop\NEYKRA` (qui ne contenait que les 2 docs) est devenu la racine propre du projet — docs + code réunis au même endroit, rien ailleurs. *(Un dossier frère nommé "NEYKRA" est impossible : collision de nom.)*
- **Git** : dépôt initialisé (`git init -b main`), premier commit effectué — voir historique git.
- **Next.js 16.3.5** (App Router, TypeScript, Tailwind CSS v4, ESLint) scaffoldé à la racine, build validé (`npm run build` ✓ : compilation + TypeScript OK).
- **Supabase** : package `@supabase/supabase-js@2.116.0` installé, client créé dans `src/lib/supabase/client.ts`, variables dans `.env.local` (gitignoré) + gabarit `.env.example` (committé).
- **Schéma SQL** : `supabase/schema.sql` complet et conforme à NEYKRA_SPEC.md §4 — les 14 tables (`profiles`, `posts`, `likes`, `comments`, `friendships`, `conversations`, `conversation_participants`, `messages`, `notifications`, `blocks`, `quotes`, `otaku_status`, `quiz_questions`, `quiz_attempts`) + index + fonctions (`is_accepted_friend`, `is_blocked`, `post_visible_to_reader`) + trigger `on_auth_user_created` (profil auto à l'inscription).
- **RLS** : activation + politiques de base conformes à NEYKRA_SPEC.md §5 sur toutes les tables.
- **Framer Motion 13.2.0** installé (pas encore utilisé, réservé aux phases suivantes).
- **README.md** réécrit pour NEYKRA.

## Ce qui reste à faire
- **Exécuter `supabase/schema.sql` (au minimum la section 5 : `compute_is_minor` + trigger `handle_new_user_auth`) dans le SQL Editor de Supabase** — indispensable pour que l'inscription remplisse bien le profil (username, birthdate, is_minor, is_private), y compris avec confirmation d'email activée.
- Créer le dépôt **GitHub** distant (authentification requise) et `git push`.
- Vérifier de bout en bout inscription / connexion / déconnexion sur le projet Supabase branché (RLS).
- Phase 2 — Profil & fil d'actualité (voir NEYKRA_SPEC.md §9).

## Bugs / points d'attention connus
- Aucun bug bloquant. Terminal Windows capricieux pour les sorties longues / builds (scaffold/install) — résolu par logs redirigés + build en arrière-plan.
- **Attention** : si `schema.sql` a déjà été exécuté AVANT cette session, le trigger `handle_new_user_auth` doit être rejoué — sinon, avec confirmation d'email activée, le profil restera incomplet (username `user_<id>`, birthdate NULL).
- Username déjà pris + confirmation d'email activée → message d'erreur générique côté inscription (le conflit unique remonte pendant le signUp, pas lors de la mise à jour du profil).
- `quiz_answers` verrouillée (aucune policy) — les clients passeront par `check_quiz_answer` en Phase 6.