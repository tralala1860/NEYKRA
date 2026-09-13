# CHANGELOG — NEYKRA

> À mettre à jour à la fin de chaque session de développement (Claude Code, Cline ou autre).
> Format : date, ce qui a été fait, ce qui reste à faire / bugs connus.

## [13/09/2026] — Session 4 — Migration vers le système 5 univers (fondations)

- **Migration `supabase/migrations/003_theme_universes.sql` (À EXÉCUTER dans le SQL Editor Supabase)** : supprime l'ancien CHECK sur `profiles.theme_preference`, migre les données (`shonen` → `inferno`, `seinen` → `void`, `kawaii` → `sakura`, toute autre valeur → `void`), pose le défaut `theme_preference = 'void'`, ajoute le CHECK 5 univers (`void`/`neon_tokyo`/`sakura`/`inferno`/`zen`), supprime la colonne `profiles.color_mode` (+ ses CHECK résiduels). Idempotente (ré-exécutable sans erreur).
- **CSS `src/app/globals.css`** : pilotage par un seul attribut `data-universe="void|neon-tokyo|sakura|inferno|zen"` (`neon_tokyo` avec underscore aussi accepté), 5 blocs univers avec les codes couleur exacts de NEYKRA_SPEC.md §6 (`--neykra-bg`, `--neykra-accent-1`, `--neykra-accent-2`, `--neykra-text`), défaut `:root` = VOID, mapping Tailwind `@theme` étendu (`bg-neykra-bg`, `text-neykra-text`, …). Anciennes variables (`--background`, `--accent`, …) conservées en alias mappés par univers + mapping `data-theme="shonen|seinen|kawaii"` pour ne pas casser les composants existants.
- **Types `src/lib/theme/types.ts`** : nouveau type `Universe` + tableau `UNIVERSES` (5 entrées) + `LEGACY_THEME_TO_UNIVERSE` ; `Theme`/`ColorMode`/`THEMES`/`COLOR_MODES` conservés en `@deprecated` pour compatibilité.
- **ThemeProvider** : nouvel état `universe` + `updateUniverse`/`transitionUniverse`, attribut `data-universe` appliqué sur `<html>` (+ `data-theme`/`data-mode="dark"` en compat), normalisation des anciennes valeurs, lecture/écriture `theme_preference` uniquement (plus de `color_mode`). `updateColorMode` conservé en no-op déprécié.
- **Server Action `src/app/settings/actions.ts` (fondation, pas de visuel)** : `updateThemePreference` accepte les 5 univers + normalise les 3 anciens thèmes, n'écrit plus `color_mode` (2e param conservé optionnel/ignoré) ; `getProfilePreferences` ne lit plus que `theme_preference`.
- **Layout `src/app/layout.tsx`** : défaut `<html data-universe="void" data-theme="void" data-mode="dark">`.
- **Schéma `supabase/schema.sql`** : `profiles.theme_preference` défaut `'void'` + CHECK 5 univers, colonne `color_mode` retirée (aligné sur la migration 003 pour les fresh installs).
- **NON touchés (étape séparée après validation)** : `Button`/`Card`/`Badge`, `ThemeSelector.tsx`, `settings/page.tsx` et autres pages.
- **À FAIRE côté humain** : 1) exécuter `supabase/migrations/003_theme_universes.sql` dans le SQL Editor Supabase ; 2) lancer `npm run build` en local (l'outil d'exécution de commandes était en panne pendant cette session — build NON vérifié, à valider avant de merger) ; 3) `git add -A && git commit -m "feat: migration vers systeme 5 univers"` ; 4) étape suivante : migrer les composants visuels (`ThemeSelector` 5 univers, `Button`/`Card`/`Badge`, pages) + effets manga + réglages d'intensité dans `/settings`.

## [13/09/2026] — Session 3 — Phase 1bis : Fondation du système de design

- **Fonts** : remplacement de Geist par Anton (display, headers) + Inter (body) via `next/font/google` dans `src/app/layout.tsx`.
- **Attributs data-theme/data-mode** : ajout sur la balise `<html>` (valeurs par défaut : `data-theme="shonen"`, `data-mode="dark"`).
- **Variables CSS complètes** : système de 6 combinaisons (Shonen/Seinen/Kawaii × Dark/Light) défini dans `src/app/globals.css` avec couleurs, fonts, spacings, radii, shadows, focus styles, scrollbar, text selection.
- **Mapping Tailwind @theme** : correspondance des variables CSS vers les noms Tailwind (`bg-accent`, `text-background`, `border-border`, etc.) pour utilisation dans les classes `bg-*`, `text-*`, `border-*`, `ring-*`.
- **Framer Motion** : intégré (déjà installé en Phase 0), animations activées dans les composants UI (Button, Card, Badge) via `whileHover`, `whileTap`, `AnimatePresence`.
- **ThemeProvider** (`src/lib/theme/ThemeProvider.tsx`) : contexte React client qui lit/écrit les préférences dans `profiles.theme_preference` et `profiles.color_mode`, applique les attributs `data-theme`/`data-mode` sur `<html>`, gère l'état de chargement.
- **Types** (`src/lib/theme/types.ts`) : export de `Theme` (`shonen | seinen | kawaii`), `ColorMode` (`dark | light`), tableaux `THEMES` et `COLOR_MODES` pour l'affichage.
- **Composants UI** (`src/components/ui/`) :
  - `Button` : variant `primary | secondary | ghost | danger`, sizes `sm | md | lg`, état `loading` avec spinner, animations Framer Motion.
  - `Card` : padding `none | sm | md | lg`, option `hover` avec lift/shadow, component polymorphique (`div | article | section`).
  - `Badge` : variant `default | success | warning | error | info | accent | outline`, sizes `sm | md`, option `pulse` (animation SVG).
- **Page `/settings`** (`src/app/settings/page.tsx`) : sélecteur de thème (3 cartes avec aperçu visuel) + bascule sombre/clair (2 boutons), lecture des préférences depuis Supabase, sauvegarde via Server Action `updateThemePreference`, messages de confirmation.
- **Server Actions** (`src/app/settings/actions.ts`) : `updateThemePreference(theme, colorMode)` pour écrire dans `profiles`, `getProfilePreferences()` pour lire les préférences actuelles.
- **SupabaseProvider** (`src/lib/supabase/provider.tsx`) : contexte React client pour fournir l'instance Supabase browser au lieu de recréer le client à chaque composant.
- **Mise à jour des pages existantes** :
  - `/feed/page.tsx` : header avec lien vers `/settings`, styles CSS variables au lieu des classes zinc.
  - `/login/page.tsx` : styles CSS variables, message de confirmation avec couleurs succès.
  - `/signup/page.tsx` : styles CSS variables.
  - `/login/login-form.tsx` : inputs avec variables CSS, bouton via composant `Button`, messages d'erreur avec couleurs error.
  - `/signup/signup-form.tsx` : idem, bouton via `Button`.
  - `/feed/logout-button.tsx` : bouton avec variables CSS.
- **SCHEMA + MIGRATION** : colonne `color_mode` ('dark'/'light', default 'dark') ajoutée à `profiles` dans `supabase/schema.sql` + migration `supabase/migrations/002_add_color_mode.sql`.
- **SPEC** : NEYKRA_SPEC.md mis à jour — section 4 (schéma profiles) avec `color_mode`, section 6 complétée avec tableaux des palettes (Shonen/Seinen/Kawaii × Dark/Light), mode sombre/clair, et détails d'implémentation technique.
- **CHANGELOG** : cette entrée.

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