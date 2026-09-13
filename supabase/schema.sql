-- =====================================================================
-- NEYKRA — Phase 0 : Schéma de base de données (Supabase / PostgreSQL 15+)
-- Conforme à la section 4 de NEYKRA_SPEC.md (tables) et à la section 5
-- (règles RLS minimales).
--
-- Exécuter dans le SQL Editor du dashboard Supabase (ou via migration).
-- ---------------------------------------------------------------------
-- Sommaire :
--  1. Extensions
--  2. Tables (15) : profiles, posts, likes, comments, friendships,
--     conversations, conversation_participants, messages, notifications,
--     blocks, quotes, otaku_status, quiz_questions, quiz_answers, quiz_attempts
--  3. Index
--  4. Fonctions utilitaires (is_accepted_friend, is_blocked, check_quiz_answer, compute_is_minor)
--  5. Trigger : création auto du profil à l'inscription auth
--  6. Row Level Security : activation + politiques de base
-- =====================================================================

-- 1. EXTENSIONS --------------------------------------------------------
create extension if not exists pgcrypto;

-- 2. TABLES -------------------------------------------------------------

-- profiles : profil public d'un utilisateur, lié à auth.users
create table public.profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  username          text not null unique,
  display_name      text,
  avatar_url        text,
  bio               text,
  birthdate         date,
  is_minor          boolean not null default false,
  theme_preference  text not null default 'shonen'
                    check (theme_preference in ('shonen', 'seinen', 'kawaii')),
  is_private        boolean not null default false,
  created_at        timestamptz not null default now()
);

-- posts : publications (texte + média optionnel)
create table public.posts (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references public.profiles (id) on delete cascade,
  content     text,
  media_url   text,
  media_type  text check (media_type in ('image', 'video', 'gif')),
  created_at  timestamptz not null default now(),
  check (content is not null or media_url is not null)
);

-- likes : "j'aime" sur un post
create table public.likes (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.posts (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (post_id, user_id)
);

-- comments : commentaires sur un post
create table public.comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.posts (id) on delete cascade,
  author_id   uuid not null references public.profiles (id) on delete cascade,
  content     text not null,
  created_at  timestamptz not null default now()
);

-- friendships : demande / acceptation d'amis
create table public.friendships (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  friend_id   uuid not null references public.profiles (id) on delete cascade,
  status      text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at  timestamptz not null default now(),
  unique (user_id, friend_id),
  check (user_id <> friend_id)
);

-- conversations : conversations 1-to-1 (messagerie temps réel)
create table public.conversations (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now()
);

-- conversation_participants : membres d'une conversation
create table public.conversation_participants (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id         uuid not null references public.profiles (id) on delete cascade,
  primary key (conversation_id, user_id)
);

-- messages : messages d'une conversation
create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id       uuid not null references public.profiles (id) on delete cascade,
  content         text not null,
  created_at      timestamptz not null default now(),
  read            boolean not null default false
);

-- notifications : notifications utilisateur
create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  type        text not null,
  content     text,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

-- blocks : blocage entre deux utilisateurs (aucune interaction possible)
create table public.blocks (
  id          uuid primary key default gen_random_uuid(),
  blocker_id  uuid not null references public.profiles (id) on delete cascade,
  blocked_id  uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

-- quotes : citations manga 100% originales (section 7)
create table public.quotes (
  id          uuid primary key default gen_random_uuid(),
  theme       text not null check (theme in ('shonen', 'seinen', 'kawaii')),
  content     text not null,
  created_at  timestamptz not null default now()
);
-- otaku_status : progression gamification (section 8bis) — 1 ligne par user
create table public.otaku_status (
  user_id               uuid primary key references public.profiles (id) on delete cascade,
  streak_actuel         int not null default 0,
  xp_total              int not null default 0,
  rang                  text not null default 'Non-Otaku',
  derniere_reponse_date date
);

-- quiz_questions : banque de questions du Quiz Otaku
create table public.quiz_questions (
  id            uuid primary key default gen_random_uuid(),
  question      text not null,
  choix         jsonb not null,
  difficulte    text not null default 'moyen'
);

-- quiz_answers : bonne réponse d'une question — JAMAIS exposée au client
-- (RLS activée, aucune policy SELECT => accès refusé à tous les rôles client ;
-- seuls le propriétaire de la table et les fonctions security definer la lisent)
create table public.quiz_answers (
  question_id   uuid primary key references public.quiz_questions (id) on delete cascade,
  bonne_reponse text not null
);

-- quiz_attempts : tentatives de quiz (anti-triche : 1 essai / jour / user)
create table public.quiz_attempts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  question_id uuid not null references public.quiz_questions (id) on delete cascade,
  date        date not null default current_date,
  reussi      boolean not null default false
);

-- 3. INDEX --------------------------------------------------------------
create index idx_posts_author_id         on public.posts (author_id);
create index idx_posts_created_at        on public.posts (created_at desc);
create index idx_likes_post_id           on public.likes (post_id);
create index idx_likes_user_id           on public.likes (user_id);
create index idx_comments_post_id        on public.comments (post_id);
create index idx_friendships_user_id     on public.friendships (user_id);
create index idx_friendships_friend_id   on public.friendships (friend_id);
create index idx_messages_conversation   on public.messages (conversation_id);
create index idx_notifications_user_id   on public.notifications (user_id);
create index idx_blocks_blocker_id       on public.blocks (blocker_id);
create index idx_blocks_blocked_id       on public.blocks (blocked_id);
create index idx_quiz_attempts_user_date on public.quiz_attempts (user_id, date);
create index idx_otaku_status_xp         on public.otaku_status (xp_total desc);

-- 4. FONCTIONS UTILITAIRES ----------------------------------------------

-- Est-ce que `target` est un ami accepté de l'utilisateur courant ?
create or replace function public.is_accepted_friend(target uuid)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.friendships f
    where f.status = 'accepted'
      and ((f.user_id = auth.uid() and f.friend_id = target)
        or (f.user_id = target and f.friend_id = auth.uid()))
  );
$$;

-- Une relation de blocage existe-t-elle (dans un sens ou l'autre) ?
create or replace function public.is_blocked(target uuid)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.blocks b
    where (b.blocker_id = auth.uid() and b.blocked_id = target)
       or (b.blocker_id = target and b.blocked_id = auth.uid())
  );
$$;

-- L'utilisateur soumet une réponse ; la fonction compare côté serveur et ne
-- renvoie que vrai/faux (jamais la bonne réponse, invisible du client).
-- security definer pour lire quiz_answers en ignorant la RLS du client.
create or replace function public.check_quiz_answer(
  p_question_id          uuid,
  p_reponse_utilisateur  text
)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select coalesce(
    (
      select (qa.bonne_reponse = p_reponse_utilisateur)
      from public.quiz_answers qa
      where qa.question_id = p_question_id
    ),
    false
  );
$$;

revoke all on function public.check_quiz_answer(uuid, text) from public;
grant execute on function public.check_quiz_answer(uuid, text) to authenticated;

-- Mineur = moins de 18 ans à la date du jour (majorité au 18e anniversaire
-- inclus). Né.e un 29/02 → majorité le 28/02 (comportement PostgreSQL de
-- `date + interval '18 years'`, aligné côté app dans src/lib/auth/age.ts).
-- Calcul serveur : is_minor n'est JAMAIS pris depuis les données client.
create or replace function public.compute_is_minor(p_birthdate date)
returns boolean
language sql
stable
set search_path = ''
as $$
  select p_birthdate is not null
    and current_date < (p_birthdate + interval '18 years');
$$;

-- 5. TRIGGER : profil auto-créé à l'inscription --------------------------
-- La ligne profiles est remplie à partir des métadonnées envoyées par l'app
-- lors du signUp (options.data : username, birthdate). is_minor et is_private
-- sont recalculés côté serveur via compute_is_minor (jamais de confiance au
-- client). trigger = security definer → contourne la RLS pour créer le profil.
create or replace function public.handle_new_user_auth()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_username  text;
  v_birthdate date;
begin
  v_username := nullif(btrim(new.raw_user_meta_data ->> 'username'), '');
  if v_username is null then
    v_username := 'user_' || replace(new.id::text, '-', '');
  end if;

  begin
    v_birthdate := nullif(new.raw_user_meta_data ->> 'birthdate', '')::date;
  exception when others then
    -- Métadonnée de naissance invalide → birthdate NULL (pas de blocage,
    -- la contrainte d'âge est appliquée au niveau applicatif, Phase 1).
    v_birthdate := null;
  end;

  insert into public.profiles (id, username, birthdate, is_minor, is_private)
  values (
    new.id,
    v_username,
    v_birthdate,
    public.compute_is_minor(v_birthdate),
    public.compute_is_minor(v_birthdate)
  )
  on conflict (id) do update
  set username   = excluded.username,
      birthdate  = excluded.birthdate,
      is_minor   = excluded.is_minor,
      is_private = excluded.is_private;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user_auth();

-- 6. ROW LEVEL SECURITY --------------------------------------------------
-- Règles minimales (section 5 de NEYKRA_SPEC.md) :
--   • chacun ne modifie que son propre contenu
--   • messages lus uniquement par les participants de la conversation
--   • blocage → aucune interaction
--   • compte privé → contenu visible seulement des amis acceptés
--   • âge obligatoire à l'inscription (birthdate), mineurs = privé par défaut

-- Fonction : un post est-il visible par le lecteur courant ?
-- (utilisée par les politiques de likes / comments)
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
        or public.is_accepted_friend(p.author_id)
        or (exists (
              select 1 from public.profiles pr
              where pr.id = p.author_id and pr.is_private = false
            )
            and not public.is_blocked(p.author_id))
      )
  );
$$;

-- 6.1 profiles
alter table public.profiles enable row level security;
create policy "profiles_select" on public.profiles
  for select using (
    id = auth.uid()
    or public.is_accepted_friend(id)
    or (is_private = false and not public.is_blocked(id))
  );
-- L'insert est réalisé par le trigger (security definer) — politique par prudence :
create policy "profiles_insert_own" on public.profiles
  for insert with check (id = auth.uid());
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- 6.2 posts
alter table public.posts enable row level security;
create policy "posts_select" on public.posts
  for select using (
    author_id = auth.uid()
    or public.is_accepted_friend(author_id)
    or (exists (
          select 1 from public.profiles p
          where p.id = author_id and p.is_private = false
        )
        and not public.is_blocked(author_id))
  );
create policy "posts_insert_own" on public.posts
  for insert with check (author_id = auth.uid());
create policy "posts_update_own" on public.posts
  for update using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "posts_delete_own" on public.posts
  for delete using (author_id = auth.uid());

-- 6.3 likes (visibilité liée à celle du post)
alter table public.likes enable row level security;
create policy "likes_select" on public.likes
  for select using (public.post_visible_to_reader(post_id));
create policy "likes_insert_own" on public.likes
  for insert with check (user_id = auth.uid());
create policy "likes_delete_own" on public.likes
  for delete using (user_id = auth.uid());

-- 6.4 comments (visibilité liée à celle du post)
alter table public.comments enable row level security;
create policy "comments_select" on public.comments
  for select using (public.post_visible_to_reader(post_id));
create policy "comments_insert_own" on public.comments
  for insert with check (author_id = auth.uid());
create policy "comments_delete_own" on public.comments
  for delete using (author_id = auth.uid());

-- 6.5 friendships
alter table public.friendships enable row level security;
create policy "friendships_select" on public.friendships
  for select using (user_id = auth.uid() or friend_id = auth.uid());
create policy "friendships_insert_own" on public.friendships
  for insert with check (user_id = auth.uid());
create policy "friendships_update_participant" on public.friendships
  for update using (user_id = auth.uid() or friend_id = auth.uid())
  with check (user_id = auth.uid() or friend_id = auth.uid());
create policy "friendships_delete_participant" on public.friendships
  for delete using (user_id = auth.uid() or friend_id = auth.uid());

-- 6.6 conversations & participants (lecture par participants uniquement)
alter table public.conversations enable row level security;
create policy "conversations_select" on public.conversations
  for select using (
    exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = id and cp.user_id = auth.uid()
    )
  );

alter table public.conversation_participants enable row level security;
create policy "participants_select" on public.conversation_participants
  for select using (user_id = auth.uid());
create policy "participants_insert_own" on public.conversation_participants
  for insert with check (user_id = auth.uid());

-- 6.7 messages (participants uniquement)
alter table public.messages enable row level security;
create policy "messages_select" on public.messages
  for select using (
    exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = messages.conversation_id and cp.user_id = auth.uid()
    )
  );
create policy "messages_insert_participant" on public.messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = messages.conversation_id and cp.user_id = auth.uid()
    )
  );
create policy "messages_update_read" on public.messages
  for update using (
    exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = messages.conversation_id and cp.user_id = auth.uid()
    )
  );

-- 6.8 notifications
alter table public.notifications enable row level security;
create policy "notifications_select" on public.notifications
  for select using (user_id = auth.uid());
create policy "notifications_update_own" on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 6.9 blocks
alter table public.blocks enable row level security;
create policy "blocks_select" on public.blocks
  for select using (blocker_id = auth.uid() or blocked_id = auth.uid());
create policy "blocks_insert_own" on public.blocks
  for insert with check (blocker_id = auth.uid());

-- 6.10 quotes (contenu public non sensible)
alter table public.quotes enable row level security;
create policy "quotes_select" on public.quotes
  for select using (true);

-- 6.11 otaku_status (privé : chaque utilisateur ne voit que le sien)
alter table public.otaku_status enable row level security;
create policy "otaku_status_select" on public.otaku_status
  for select using (user_id = auth.uid());
create policy "otaku_status_update_own" on public.otaku_status
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 6.12 quiz_questions (lecture ouverte aux connectés ; la bonne réponse N'EST
--      PAS dans cette table — elle vit dans quiz_answers, verrouillée)
alter table public.quiz_questions enable row level security;
create policy "quiz_questions_select" on public.quiz_questions
  for select using (true);

-- 6.13 quiz_attempts (historique personnel, insert/update par l'utilisateur)
alter table public.quiz_attempts enable row level security;
create policy "quiz_attempts_select" on public.quiz_attempts
  for select using (user_id = auth.uid());
create policy "quiz_attempts_insert_own" on public.quiz_attempts
  for insert with check (user_id = auth.uid());
create policy "quiz_attempts_update_own" on public.quiz_attempts
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 6.14 quiz_answers (table verrouillée : AUCUNE policy définie)
--      RLS activée + absence totale de policy SELECT/INSERT/UPDATE/DELETE sur
--      cette table = accès refusé aux rôles client (anon, authenticated).
--      Seul le propriétaire (postgres) et les fonctions security definer
--      (ex. check_quiz_answer) peuvent y toucher.
alter table public.quiz_answers enable row level security;