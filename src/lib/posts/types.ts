// NEYKRA — Types pour les posts / réactions / commentaires (Phase 2, étape 2).
// Exportés depuis src/lib/posts/actions.ts et les composants feed.

export type PostMediaType = "image" | "video" | "gif";

// 6 réactions manga (migration 005 — remplace le like binaire).
export const REACTION_TYPES = [
  "like",
  "love",
  "haha",
  "wow",
  "sad",
  "fire",
] as const;

export type ReactionType = (typeof REACTION_TYPES)[number];

export type ReactionCounts = Partial<Record<ReactionType, number>>;

export type PostRow = {
  id: string;
  author_id: string;
  content: string | null;
  media_url: string | null;
  media_type: PostMediaType | null;
  created_at: string;
};

export type PostWithAuthor = PostRow & {
  author_username: string;
  author_display_name: string | null;
  author_avatar_url: string | null;
  author_otaku_rank: string | null;
  /** Décompte des réactions par type (seuls les types présents figurent). */
  reactions: ReactionCounts;
  /** Réaction de l'utilisateur courant sur ce post (null si aucune). */
  user_reaction: ReactionType | null;
  comment_count: number;
  comments?: CommentWithAuthor[];
};

/**
 * Page de posts du fil (/feed) — pagination par curseur sur `created_at`.
 * `posts` = page renvoyée, `hasMore` = reste-t-il des posts plus anciens
 * (détecté côté serveur en sondant un post de plus que la limite demandée),
 * `error` = renseigné si la requête a échoué (la page est alors vide).
 */
export type FeedPostsPage = {
  posts: PostWithAuthor[];
  hasMore: boolean;
  error?: string;
};

export type CreatePostFormState = {
  error?: string;
  success?: string;
};

export type ReactionToggleState = {
  error?: string;
  reactions: ReactionCounts;
  user_reaction: ReactionType | null;
};

export type CommentFormState = {
  error?: string;
  success?: string;
};

export type CommentRow = {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
};

export type CommentWithAuthor = CommentRow & {
  author_username: string;
  author_display_name: string | null;
  author_avatar_url: string | null;
  author_otaku_rank: string | null;
};

export type DeletePostFormState = {
  error?: string;
  success?: string;
};

export type DeleteCommentFormState = {
  error?: string;
  success?: string;
};
