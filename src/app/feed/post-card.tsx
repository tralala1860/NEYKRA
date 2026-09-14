// NEYKRA — Carte d'un post dans le fil d'actualité (/feed).
// Avatar + nom de l'auteur (lien vers profil), contenu texte, média si présent,
// date relative, badge de rang otaku, bouton like (toggle, compteur, état glow
// si déjà liké), section commentaires, bouton supprimer visible seulement sur
// le propre contenu de l'utilisateur connecté.

"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { timeAgo } from "@/lib/posts/time-ago";
import { toggleLike } from "@/lib/posts/actions";
import { deletePost } from "@/lib/posts/actions";
import { CommentList } from "./comment-list";
import { CommentForm } from "./comment-form";
import type { PostWithAuthor } from "@/lib/posts/types";
import type { LikeToggleState } from "@/lib/posts/types";

type PostCardProps = {
  post: PostWithAuthor;
  isOwner: boolean;
};

export function PostCard({ post, isOwner }: PostCardProps) {
  const [likeState, toggleAction, likePending] = useActionState(
    toggleLike,
    { liked: post.has_liked, like_count: post.like_count } as LikeToggleState
  );

  const likeLiked = likeState.liked ?? post.has_liked;

  return (
    <Card padding="lg" className="w-full max-w-2xl">
      {/* En-tête auteur */}
      <div className="flex items-start gap-3">
        {post.author_avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.author_avatar_url}
            alt={post.author_display_name ?? post.author_username}
            className="h-10 w-10 rounded-none border-2 border-[var(--border)] object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center border-2 border-[var(--border)] bg-[var(--accent-subtle)] font-display text-base text-[var(--accent)]">
            {(post.author_display_name?.[0] ?? post.author_username[0] ?? "?").toUpperCase()}
          </div>
        )}

        <div className="flex flex-1 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <Link
              href={`/profile/${post.author_username}`}
              className="font-medium text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
            >
              {post.author_display_name ?? post.author_username}
            </Link>

            {post.author_otaku_rank && (
              <Badge variant="accent" size="sm">
                {post.author_otaku_rank}
              </Badge>
            )}

            {isOwner && (
              <span className="text-xs text-[var(--text-tertiary)]">(toi)</span>
            )}
          </div>

          <time className="text-xs text-[var(--text-tertiary)]">
            {timeAgo(post.created_at)}
          </time>
        </div>
      </div>

      {/* Contenu texte */}
      {post.content && (
        <p className="mt-4 text-[var(--text-primary)] whitespace-pre-wrap break-words">
          {post.content}
        </p>
      )}

      {/* Média */}
      {post.media_url && post.media_type && (
        <div className="mt-4">
          {post.media_type === "video" ? (
            <video
              src={post.media_url}
              controls
              className="rounded-none border border-[var(--border)]"
              style={{ width: "100%", maxHeight: "420px" }}
            />
          ) : post.media_type === "gif" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.media_url}
              alt="Média du post"
              className="rounded-none border border-[var(--border)] max-h-[420px] w-full object-contain"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.media_url}
              alt="Média du post"
              className="rounded-none border border-[var(--border)] max-h-[420px] w-full object-cover"
            />
          )}
        </div>
      )}

      {/* Zone actions (like + compteur) */}
      <div className="mt-4 flex items-center justify-between gap-4 border-t border-[var(--border)] pt-3">
        <form action={toggleAction} className="flex items-center gap-2">
          <input type="hidden" name="postId" value={post.id} />
          <Button
            type="submit"
            variant={likeLiked ? "primary" : "secondary"}
            size="sm"
            disabled={likePending}
            loading={likePending}
            className={likeLiked ? "neykra-btn-glow" : ""}
          >
            <svg
              className="mr-1 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill={likeLiked ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={likeLiked ? 0 : 2}
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            {likeState.like_count > 0 ? String(likeState.like_count) : ""}
          </Button>
        </form>

        <div className="text-sm text-[var(--text-secondary)]">
          {post.comment_count > 0 && (
            <>
              <span className="mr-1">{post.comment_count}</span>
              <span className="text-[var(--text-tertiary)]">commentaires</span>
            </>
          )}
        </div>
      </div>

      {/* Section commentaires */}
      <div className="mt-3 border-t border-[var(--border)] pt-3">
        <CommentList comments={post.comments ?? []} />
        <CommentForm postId={post.id} />
      </div>

      {/* Bouton supprimer — visible seulement si propriétaire */}
      {isOwner && (
        <div className="mt-3 flex justify-end">
          <form
            action={async () => {
              await deletePost(post.id);
            }}
          >
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="text-[var(--color-error)] hover:bg-[var(--color-error)]/10"
            >
              Supprimer le post
            </Button>
          </form>
        </div>
      )}
    </Card>
  );
}
