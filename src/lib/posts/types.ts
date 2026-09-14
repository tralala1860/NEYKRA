// NEYKRA — Types pour les posts / likes / commentaires (Phase 2, étape 2).
// Exportés depuis src/lib/posts/actions.ts et les composants feed.

export type PostMediaType = "image" | "video" | "gif";

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
  like_count: number;
  comment_count: number;
  has_liked: boolean;
  comments?: CommentWithAuthor[];
};

export type CreatePostFormState = {
  error?: string;
  success?: string;
};

export type LikeToggleState = {
  error?: string;
  liked: boolean;
  like_count: number;
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
