# NEYKRA — Document de Spécifications Maître

> **Instructions pour l'agent IA qui reprend ce projet (Claude Code, Cline + Gemini, ou autre) :**
> Ce document est la source de vérité du projet. Lis-le entièrement avant de coder quoi que ce soit.
> Respecte l'architecture, les conventions de nommage et l'ordre des phases définis ici.
> Si tu modifies la structure de la base de données ou ajoutes une fonctionnalité majeure, mets à jour ce fichier en conséquence à la fin de ta session.
> Peu importe l'outil utilisé (Claude Code, Cline avec Gemini, etc.), les règles de la section 3 s'appliquent à l'identique — c'est ce qui garantit des résultats cohérents d'une session à l'autre, même en changeant d'IA.

---

## 1. Vue d'ensemble du projet

**Nom** : NEYKRA
**Type** : Réseau social complet inspiré de Facebook, avec une identité visuelle manga/anime
**Public cible** : Grand public francophone (V1), incluant les mineurs → exigences de sécurité renforcées
**Modèle économique** : Gratuit, pas de monétisation en V1
**Rythme** : Développement rapide, première version fonctionnelle visée en quelques semaines

---

## 2. Stack technique

| Couche | Technologie | Raison |
|---|---|---|
| Frontend | Next.js 14+ (App Router) + TypeScript | Standard industrie, SSR, performant |
| Style | Tailwind CSS | Rapide, cohérent, facile à thémer |
| Animations | Framer Motion | Référence React pour animations fluides |
| Backend | Supabase (PostgreSQL + Auth + Realtime + Storage) | Tout-en-un, pas de serveur à gérer |
| Hébergement | Vercel (sous-domaine gratuit pour commencer) | Fait pour Next.js, déploiement instantané |
| Versioning | Git + GitHub | Obligatoire même en solo — mémoire entre sessions IA |

---

## 3. Méthode de travail (IMPORTANT)

Binate travaille **seul**, avec un **agent IA en sessions successives** (Claude Code, ou Cline branché sur un modèle Gemini). Chaque session peut perdre le contexte des précédentes, quel que soit l'outil.

**Règles à suivre impérativement — identiques pour Claude Code et pour Cline+Gemini :**
1. Tout le code vit sur **GitHub**, jamais uniquement en local ou par copier-coller de fichiers isolés.
2. Chaque session commence par : lire ce document + faire un `git pull` + lire le `CHANGELOG.md`. Avec Cline, demande-le explicitement dans le premier message de chaque session (ex : « Lis NEYKRA_SPEC.md et CHANGELOG.md avant de commencer »).
3. Chaque session se termine par : un commit clair + mise à jour du `CHANGELOG.md` (qu'est-ce qui a été fait, qu'est-ce qui reste).
4. Ne jamais casser une fonctionnalité existante sans le signaler explicitement dans le changelog.
5. Une fonctionnalité = une branche Git (ex: `feature/messagerie-temps-reel`), fusionnée sur `main` seulement si elle fonctionne.

---

## 4. Schéma de base de données (Supabase)

### `profiles`
| Colonne | Type | Notes |
|---|---|---|
| id | uuid | Lié à `auth.users` |
| username | text | Unique |
| display_name | text | |
| avatar_url | text | |
| bio | text | |
| birthdate | date | Nullable en base — la valeur est exigée au formulaire d'inscription (Phase 1) ; le trigger de création de profil la prend depuis `auth.users.raw_user_meta_data` si fournie, sinon NULL. `is_minor` est recalculé au niveau serveur (SQL + TS). |
| is_minor | boolean | Calculé automatiquement depuis `birthdate` |
| theme_preference | text | 'void' / 'neon_tokyo' / 'sakura' / 'inferno' / 'zen' (voir section 6) |
| ~~color_mode~~ | ~~text~~ | **Colonne retirée (migration 003)** — chaque univers a désormais un mode de couleur fixe, plus de toggle dark/light séparé |
| is_private | boolean | Vrai par défaut si mineur |
| created_at | timestamp | |

### `posts`
id, author_id, content, media_url, media_type ('image' / 'video' / 'gif'), created_at

### `likes`
id, post_id, user_id, created_at

### `comments`
id, post_id, author_id, content, created_at

### `friendships`
id, user_id, friend_id, status ('pending' / 'accepted'), created_at

### `conversations`
id, created_at

### `conversation_participants`
conversation_id, user_id

### `messages`
id, conversation_id, sender_id, content, created_at, read

### `notifications`
id, user_id, type, content, read, created_at

### `blocks`
id, blocker_id, blocked_id, created_at

### `quotes`
id, theme ('void' / 'neon_tokyo' / 'sakura' / 'inferno' / 'zen'), content, created_at

---

## 5. Sécurité (Row Level Security)

Règles RLS minimales à mettre en place dès la V1 :
- Un utilisateur ne peut modifier que son propre profil/posts/commentaires
- Un utilisateur ne peut lire les messages que des conversations dont il fait partie
- Si `blocks` contient une relation entre deux utilisateurs, aucune interaction n'est possible entre eux (ni post visible, ni message)
- Si `profiles.is_private = true`, seuls les amis acceptés voient le contenu
- Vérification d'âge obligatoire à l'inscription (`birthdate`), comptes mineurs = `is_private = true` par défaut, messages uniquement entre amis confirmés (pas d'inconnus)

---

## 6. Système de design visuel — 5 univers (direction artistique premium)

> Direction validée : mélange anime moderne / manga / UI futuriste / cyberpunk léger / références japonaises traditionnelles, encadré par la **règle des 70/20/10** : 70% UI moderne et professionnelle, 20% identité anime/manga/japonaise, 10% effets expérimentaux. La fonctionnalité et la lisibilité priment toujours sur l'esthétique — aucun élément décoratif ne doit ressembler à un bouton, et inversement.

### 6.1 Les 5 univers (chacun a un mode de couleur FIXE — plus de toggle dark/light séparé)

| Univers | Ambiance | Mode | Fond | Accent 1 | Accent 2 | Texte |
|---|---|---|---|---|---|---|
| **VOID** | Mystérieuse et puissante | Dark | `#0A0006` | Rouge crimson `#E11D48` | Magenta `#C026D3` | `#F5F3F7` |
| **NEON TOKYO** | Futuriste / cyberpunk | Dark | `#06080F` | Cyan `#22D3EE` | Violet `#A78BFA` | `#E8F6FA` |
| **SAKURA** | Élégante et douce | Light | `#FFFBFD` | Rose `#F472B6` | Violet doux `#C4B5FD` | `#3B2A35` |
| **INFERNO** | Énergique | Dark | `#0D0704` | Orange `#FB923C` | Rouge `#EF4444` | `#FFF3EA` |
| **ZEN** | Minimaliste, traditionnelle japonaise | Light | `#FAFAF8` (papier washi) | Rouge japonais `#BC002D` | Noir encre `#1A1A1A` | `#1A1A1A` |

*(VOID fusionne l'ancien Seinen, INFERNO fusionne l'ancien Shonen, SAKURA fusionne l'ancien Kawaii. NEON TOKYO et ZEN sont nouveaux. L'ancien système à 3 thèmes × mode dark/light séparé — Shonen/Seinen/Kawaii — est entièrement retiré et remplacé par ces 5 univers.)*

**Univers par défaut à l'inscription** : VOID.

### 6.2 Hiérarchie visuelle (priorité stricte)
1. Fonctionnalité
2. Lisibilité
3. Navigation
4. Identité visuelle
5. Effets visuels

### 6.3 Codes visuels manga à utiliser (avec parcimonie — signature, pas systématique)
- Trame de points (halftone) très légère en fond de certaines sections (opacity ~0.06–0.1), en CSS pur
- Cadres/cartes avec bordures franches et légère asymétrie (rotation subtile, jamais appliquée à tout)
- Lignes dynamiques (speed lines) en arrière-plan de titres clés, discrètes
- Petites annotations façon "numéro de chapitre" pour la navigation principale (ex: 01 — ACCUEIL, 02 — FIL D'ACTUALITÉ), doit rester compréhensible sans culture manga
- Glow contrôlé sur les éléments interactifs actifs uniquement (pas partout)
- personnages d'anime existants

**Interdits explicites** :kanji décoratifs sans fonction, animation permanente sur tous les éléments, néon sur tout, texte surdimensionné illisible, décorations confondables avec des boutons.

### 6.4 Typographie
- Titres/boutons/badges : police impact à accents français corrects (*Anton* ou *Passion One*), poids 400 uniquement (Anton n'a pas de graisse 700)
- Texte courant : *Inter* ou *Rubik*

### 6.5 Personnalisation utilisateur (page /settings)
Réglages simples avec valeurs par défaut intelligentes — l'utilisateur qui ne configure rien doit avoir une expérience impeccable :
- Choix de l'univers (5 options)
- Intensité des effets (réduit / normal / élevé)
- Niveau d'animations (réduit / normal), avec respect de `prefers-reduced-motion`
- *(Personnalisation fine de la couleur d'accent et des particules : reportée à une itération ultérieure, pas en V1 du design system)*

### 6.6 Animations
Subtiles, fluides, toujours justifiées par une raison fonctionnelle : transitions douces entre pages, micro-interactions sur boutons, hover élégant sur cartes, transition de changement d'univers. Jamais d'animation qui ralentit le clic ou bloque la navigation. Option de réduction/désactivation toujours disponible.

### 6.7 Responsive
Effets réduits sur mobile, animations simplifiées, CTA et navigation toujours visibles et clairs. Pas de design magnifique uniquement sur desktop avec un mobile dégradé.

### 6.8 Accessibilité
Contraste suffisant sur les 5 univers, tailles de boutons raisonnables, états hover/focus/active visibles, navigation compréhensible sans connaître le concept artistique.

### 6.9 Implémentation technique
- Un seul attribut sur `<html>` : `data-universe="void|neon-tokyo|sakura|inferno|zen"` (remplace les anciens `data-theme` + `data-mode` — le mode dark/light est désormais implicite à chaque univers)
- Variables CSS définies dans `src/app/globals.css` sous forme de blocs `[data-universe="void"]`, `[data-universe="sakura"]`, etc. (`--neykra-bg`, `--neykra-accent-1`, `--neykra-accent-2`, `--neykra-text`)
- Mapping Tailwind `@theme` pour utiliser les variables CSS via des noms sémantiques (`bg-accent`, `text-background`, `border-border`, etc.)
- Contexte React `ThemeProvider` (`src/lib/theme/ThemeProvider.tsx`) mis à jour pour gérer 5 univers au lieu de 3 thèmes × 2 modes
- Page `/settings` (`src/app/settings/page.tsx`) : sélecteur des 5 univers + réglages d'intensité effets/animations, sauvegarde via Server Action `updateThemePreference`
- Composants UI réutilisables (`src/components/ui/`) : `Button`, `Card`, `Badge` — tous utilisant les variables CSS et les fonts Anton (display, poids 400 uniquement) / Inter (corps)
- **Migration 003** (`supabase/migrations/003_theme_universes.sql`) : met à jour la contrainte check sur `theme_preference`, migre les valeurs existantes (shonen→inferno, seinen→void, kawaii→sakura), et supprime la colonne `color_mode`
- Transition animée en fondu (Framer Motion) au changement d'univers, structure et navigation inchangées

### 6.10 Règle permanente pour toutes les phases suivantes

**À partir de la Phase 2, chaque nouveau composant ou page doit appliquer l'identité manga dès sa création** (trame de points sur les cartes, bordures nettes avec ombre décalée sans blur, glow contrôlé sur les actions primaires, coins non-arrondis, règle des 70/20/10) — en utilisant systématiquement les composants `Button`/`Card`/`Badge` de `src/components/ui/`, jamais du HTML custom stylé à la main. Objectif : ne plus jamais avoir à "manga-iser" une page après coup comme ce fut le cas pour `/settings`.

- Citations **100% originales** 
- Stockées dans la table `quotes`, filtrées par univers actif de l'utilisateur (`theme` = une des 5 valeurs de la section 6.1)
- Apparition **aléatoire**, pas systématique (~1 chance sur 4 par chargement de page)
- Position fixe et discrète (coin de sidebar ou bandeau furtif), jamais intrusive sur le contenu principal
- Ne doit pas apparaître sur toutes les pages

---

## 8. Animations attendues (Framer Motion)

- Apparition des posts au scroll (fade + slide)
- Bouton like : effet "pop"/particules façon aura de combat
- Transitions entre pages façon "slash"
- Nouveaux posts : flash bref façon "impact frame"
- Messages qui glissent à l'arrivée dans le chat

---

## 8bis. Système de Quiz Otaku (statut & progression)

**Principe anti-triche** : un seul quiz par jour, un seul essai possible. Aucune possibilité de retenter avant le renouvellement du lendemain (24h).

**Mécanique**
- Quiz quotidien (1 question, culture générale manga/anime, renouvelé toutes les 24h)
- Bonne réponse → streak +1, statut Otaku actif/renforcé
- Mauvaise réponse ou pas de réponse → streak remis à 0
- 48h sans connexion → perte automatique du statut actif (le streak repart de zéro au retour, pas de blocage de durée)

**Rangs (basés sur le streak de jours consécutifs réussis)**
| Rang | Condition |
|---|---|
| Non-Otaku | Pas de streak actif |
| Otaku Débutant | 1–6 jours consécutifs |
| Otaku Confirmé | 7–29 jours consécutifs |
| Otaku Légendaire | 30+ jours consécutifs |

**XP permanent**
- Chaque bonne réponse donne de l'XP cumulable, qui ne se réinitialise jamais (indépendant du streak)
- Sert de classement global "Top Otaku"

**Source des questions**
- Banque de base écrite manuellement (Binate + Claude), ~100 questions de culture générale manga/anime au lancement
- Génération IA en complément prévue plus tard pour enrichir la banque (pas en V1)
- Difficulté aléatoire, même niveau pour tous les utilisateurs (pas de scaling par rang en V1)

**Tables Supabase additionnelles**

`otaku_status`
| Colonne | Type |
|---|---|
| user_id | uuid |
| streak_actuel | int |
| xp_total | int |
| rang | text |
| derniere_reponse_date | date |

`quiz_questions`
| Colonne | Type |
|---|---|
| id | uuid |
| question | text |
| choix | jsonb |
| difficulte | text |

`quiz_answers`
| Colonne | Type | Notes |
|---|---|---|
| question_id | uuid | PK, FK → `quiz_questions.id` (ON DELETE CASCADE) |
| bonne_reponse | text | **Jamais exposée au client** |

> **RLS sur `quiz_answers`** : table verrouillée — RLS activée, aucune policy SELECT/INSERT/UPDATE/DELETE définie → accès refusé aux rôles client (`anon`, `authenticated`). Seul le propriétaire (postgres) et les fonctions `security definer` (ex. `check_quiz_answer`) peuvent lire/écrire cette table. La bonne réponse ne transite donc jamais sur le réseau client ; la validation se fait exclusivement côté serveur via `check_quiz_answer(question_id, reponse_utilisateur) → boolean`.

`quiz_attempts`
| Colonne | Type |
|---|---|
| id | uuid |
| user_id | uuid |
| question_id | uuid |
| date | date |
| reussi | boolean |

**Affichage** : badge de rang visible à côté du pseudo partout (posts, commentaires, messages, profil), avec glow/couleur selon le rang (bronze/argent/or). Barre d'XP animée sur le profil.

---

## 8ter. Améliorations design & engagement

- Effet lumineux (glow) animé autour de l'avatar des utilisateurs avec statut Otaku actif
- Effet sonore léger (optionnel/activable) lors d'une bonne réponse au quiz
- Écran de résultat du quiz avec animation façon "level up" de jeu vidéo
- Classement (leaderboard) des meilleurs streaks/XP
- Onboarding à la première connexion présentant le concept otaku/quiz, ton fun façon prologue d'anime
- Rappel de quiz quotidien (notification, à activer plus tard — pas bloquant pour la V1)

---

## 9. Feuille de route (phases de développement)

### Phase 0 — Fondations ✅ TERMINÉE
- [x] Créer le projet Supabase
- [x] Créer le projet Next.js + connecter Supabase
- [x] Mettre en place Git/GitHub
- [x] Créer toutes les tables + RLS de base

### Phase 1 — Authentification ✅ TERMINÉE
- [x] Inscription (avec date de naissance obligatoire)
- [x] Connexion
- [x] Détection automatique compte mineur + paramètres par défaut

### Phase 1bis — Fondation du système de design ✅ TERMINÉE (v1 à 3 thèmes), EN COURS DE MIGRATION vers 5 univers
- [x] Variables CSS (version initiale 3 thèmes × dark/light — en cours de remplacement)
- [x] Polices Anton/Inter intégrées
- [x] Composants UI de base (Button, Card, Badge)
- [x] Page /settings
- [ ] **Migration vers le système 5 univers (section 6)** — migration 003, nouveaux tokens CSS, ThemeProvider mis à jour
- [ ] Effets visuels manga (halftone, cadres, speed lines) appliqués aux composants existants
- [ ] Réglages d'intensité effets/animations dans /settings

### Phase 2 — Profil & fil d'actualité
- [ ] Page de profil
- [ ] Création de post (texte + image)
- [ ] Fil d'actualité
- [ ] Likes + commentaires

### Phase 3 — Relations sociales
- [ ] Système d'amis (demande/acceptation)
- [ ] Système de blocage
- [ ] Recherche d'utilisateurs (barre de recherche)
- [ ] Pages CGU / Politique de confidentialité (version simple)

### Phase 4 — Messagerie temps réel
- [ ] Conversations 1-to-1
- [ ] Messages en temps réel (Supabase Realtime)

### Phase 5 — Citations & animations avancées
- [ ] Système de citations aléatoires (table quotes)
- [ ] Animations Framer Motion sur tout le site (posts, likes, transitions de page, messages)

### Phase 6 — Quiz Otaku & gamification
- [ ] Tables otaku_status / quiz_questions / quiz_attempts
- [ ] Logique quiz quotidien (1 essai/jour, anti-triche)
- [ ] Calcul streak + rangs + XP
- [ ] Badges de rang affichés partout
- [ ] Banque initiale de questions (culture générale manga/anime)
- [ ] Classement (leaderboard)

### Phase 7 (V2, plus tard)
- [ ] Stories
- [ ] Notifications
- [ ] Modération avancée (signalement)
- [ ] Onboarding animé façon prologue d'anime
- [ ] Navigation façon "chapitres" (01 — ACCUEIL, 02 — FIL D'ACTUALITÉ...)
- [ ] Personnalisation fine (couleur d'accent, particules)

---

## 9bis. Décisions finales complémentaires

- **Univers par défaut** : VOID à l'inscription, modifiable ensuite dans les paramètres
- **Médias autorisés** : images, vidéos courtes, GIFs, texte
- **Recherche d'utilisateurs** : incluse dès la V1 (barre de recherche)
- **Pages légales** : CGU + Politique de confidentialité en version simple dès la V1 (à renforcer plus tard — important car l'app accueille des mineurs et traite des données personnelles)

---

## 10. Branding NEYKRA

- Logo : à créer (pas encore existant)
- Couleurs officielles : celles de l'univers VOID par défaut (rouge crimson `#E11D48` / magenta `#C026D3` sur fond noir profond), les 4 autres univers déclinent l'identité
- Statut : identité visuelle en cours de construction (système 5 univers, section 6)

---

## 11. Changelog

Le suivi des sessions de développement se fait dans un fichier séparé : **`CHANGELOG.md`**, à la racine du dépôt GitHub (pas dans ce document). Ce document (NEYKRA_SPEC.md) reste la référence stable des specs ; le changelog, lui, évolue à chaque session de développement, que l'agent utilisé soit Claude Code ou Cline+Gemini.

Format attendu dans CHANGELOG.md :
```
## [Date] — Titre de la session
- Ce qui a été fait
- Ce qui reste à faire / bugs connus
```
