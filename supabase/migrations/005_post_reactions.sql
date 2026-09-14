-- =====================================================================
-- NEYKRA — Migration 005 : réactions manga sur les posts
-- Remplace le like binaire par 6 réactions : like / love / haha /
-- wow / sad / fire (colonne likes.reaction_type, défaut 'like').
-- Idempotente : ré-exécutable sans erreur.
-- À EXÉCUTER dans le SQL Editor Supabase.
-- =====================================================================

-- 1. Colonne reaction_type (défaut 'like' → les likes existants deviennent
--    des réactions 'like', aucune perte de données).
ALTER TABLE public.likes
  ADD COLUMN IF NOT EXISTS reaction_type text NOT NULL DEFAULT 'like';

-- 2. Filet de sécurité : si la colonne préexistait sans valeur, on backfill.
UPDATE public.likes
SET reaction_type = 'like'
WHERE reaction_type IS NULL;

-- 3. Contrainte CHECK sur les 6 valeurs autorisées (idempotent).
ALTER TABLE public.likes DROP CONSTRAINT IF EXISTS likes_reaction_type_check;
ALTER TABLE public.likes
  ADD CONSTRAINT likes_reaction_type_check
  CHECK (reaction_type IN ('like', 'love', 'haha', 'wow', 'sad', 'fire'));

-- 4. Une seule réaction par utilisateur par post (modèle Facebook) :
--    contrainte UNIQUE (post_id, user_id), ajoutée de façon idempotente.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'likes_one_reaction_per_user'
      AND conrelid = 'public.likes'::regclass
  ) THEN
    -- Dédoublonnage avant ajout de la contrainte (garde la plus ancienne
    -- réaction de chaque couple post/utilisateur).
    DELETE FROM public.likes a
    USING public.likes b
    WHERE a.post_id = b.post_id
      AND a.user_id = b.user_id
      AND a.created_at > b.created_at;

    ALTER TABLE public.likes
      ADD CONSTRAINT likes_one_reaction_per_user UNIQUE (post_id, user_id);
  END IF;
END $$;
