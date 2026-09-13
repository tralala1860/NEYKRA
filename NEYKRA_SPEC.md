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
| birthdate | date | Obligatoire — sert à détecter les comptes mineurs |
| is_minor | boolean | Calculé automatiquement depuis `birthdate` |
| theme_preference | text | 'shonen' / 'seinen' / 'kawaii' |
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
id, theme ('shonen' / 'seinen' / 'kawaii'), content, created_at

---

## 5. Sécurité (Row Level Security)

Règles RLS minimales à mettre en place dès la V1 :
- Un utilisateur ne peut modifier que son propre profil/posts/commentaires
- Un utilisateur ne peut lire les messages que des conversations dont il fait partie
- Si `blocks` contient une relation entre deux utilisateurs, aucune interaction n'est possible entre eux (ni post visible, ni message)
- Si `profiles.is_private = true`, seuls les amis acceptés voient le contenu
- Vérification d'âge obligatoire à l'inscription (`birthdate`), comptes mineurs = `is_private = true` par défaut, messages uniquement entre amis confirmés (pas d'inconnus)

---

## 6. Système de thèmes visuels

3 thèmes au lancement, sélectionnables par l'utilisateur et sauvegardés dans `profiles.theme_preference` :

1. **Shonen** — énergique, couleurs vives, style Naruto/One Piece
2. **Seinen** — sombre, dramatique, style Tokyo Ghoul/AOT
3. **Kawaii** — doux, pastel, slice of life

*(Cyberpunk prévu en V2)*

Chaque thème = variables CSS (couleurs, police d'accent, style des bordures). Transition animée entre thèmes via Framer Motion.

---

## 7. Système de citations manga

- Citations **100% originales** (jamais de citations réelles de mangas existants — droit d'auteur)
- Stockées dans la table `quotes`, filtrées par thème actif de l'utilisateur
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
| bonne_reponse | text |
| difficulte | text |

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

### Phase 0 — Fondations (à faire en premier)
- [ ] Créer le projet Supabase
- [ ] Créer le projet Next.js + connecter Supabase
- [ ] Mettre en place Git/GitHub
- [ ] Créer toutes les tables + RLS de base

### Phase 1 — Authentification
- [ ] Inscription (avec date de naissance obligatoire)
- [ ] Connexion
- [ ] Détection automatique compte mineur + paramètres par défaut

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

### Phase 5 — Habillage manga
- [ ] Système de thèmes (3 thèmes)
- [ ] Système de citations aléatoires
- [ ] Animations Framer Motion sur tout le site

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
- [ ] Thème Cyberpunk
- [ ] Modération avancée (signalement)
- [ ] Onboarding animé façon prologue d'anime

---

## 9bis. Décisions finales complémentaires

- **Thème par défaut** : Shonen à l'inscription, modifiable ensuite dans les paramètres
- **Médias autorisés** : images, vidéos courtes, GIFs, texte
- **Recherche d'utilisateurs** : incluse dès la V1 (barre de recherche)
- **Pages légales** : CGU + Politique de confidentialité en version simple dès la V1 (à renforcer plus tard — important car l'app accueille des mineurs et traite des données personnelles)

---

## 10. Branding NEYKRA

- Logo : à créer (pas encore existant)
- Couleurs officielles : à définir (dépendront du thème choisi par défaut)
- Statut : identité visuelle à construire en parallèle du développement

---

## 11. Changelog

Le suivi des sessions de développement se fait dans un fichier séparé : **`CHANGELOG.md`**, à la racine du dépôt GitHub (pas dans ce document). Ce document (NEYKRA_SPEC.md) reste la référence stable des specs ; le changelog, lui, évolue à chaque session de développement, que l'agent utilisé soit Claude Code ou Cline+Gemini.

Format attendu dans CHANGELOG.md :
```
## [Date] — Titre de la session
- Ce qui a été fait
- Ce qui reste à faire / bugs connus
```
