// NEYKRA — Carte d'un post dans le fil d'actualité (/feed).
// Avatar + nom de l'auteur (lien vers profil), contenu texte, média si présent,
// date relative, badge de rang otaku, sélecteur de réactions manga (6 emojis,
// survol desktop / appui long mobile, compteurs par type), section commentaires,
// bouton supprimer visible seulement sur le propre contenu de l'utilisateur connecté.

"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { timeAgo } from "@/lib/posts/time-ago";
import { toggleReaction } from "@/lib/posts/actions";
import { deletePost } from "@/lib/posts/actions";
import { CommentList } from "./comment-list";
import { CommentForm } from "./comment-form";
import {
  REACTION_TYPES,
  type PostWithAuthor,
  type ReactionCounts,
  type ReactionType,
} from "@/lib/posts/types";

const REACTION_META: Record<ReactionType, { emoji: string; label: string }> = {
  like: { emoji: "👍", label: "Like" },
  love: { emoji: "💥", label: "Love" },
  haha: { emoji: "😂", label: "Haha" },
  wow: { emoji: "😱", label: "Wow" },
  sad: { emoji: "😢", label: "Sad" },
  fire: { emoji: "🔥", label: "Fire" },
};

type PostCardProps = {
  post: PostWithAuthor;
  isOwner: boolean;
};

export function PostCard({ post, isOwner }: PostCardProps) {
  const [pending, startTransition] = useTransition();
  const [reactions, setReactions] = useState<ReactionCounts>(
    post.reactions ?? {}
  );
  const [userReaction, setUserReaction] = useState<ReactionType | null>(
    post.user_reaction ?? null
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const longPressTimer = useRef<number | null>(null);

  function react(type: ReactionType) {
    setPickerOpen(false);
    startTransition(async () => {
      const result = await toggleReaction(post.id, type);
      if (!result.error) {
        setReactions(result.reactions);
        setUserReaction(result.user_reaction);
      }
    });
  }

  // Appui long (mobile) pour ouvrir le sélecteur de réactions
  function startLongPress() {
    clearLongPress();
    longPressTimer.current = window.setTimeout(() => setPickerOpen(true), 400);
  }

  function clearLongPress() {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  // Compteurs par type — uniquement les réactions présentes (≥ 1)
  const activeCounts = REACTION_TYPES.filter((t) => (reactions[t] ?? 0) > 0);

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

      {/* Zone actions (réactions + compteur commentaires) */}
      <div className="mt-4 border-t border-[var(--border)] pt-3">
        <div className="flex items-start justify-between gap-4">
          {/* Sélecteur de réactions : survol (desktop) / appui long (mobile) */}
          <div
            className="group relative select-none"
            onTouchStart={startLongPress}
            onTouchEnd={clearLongPress}
            onTouchMove={clearLongPress}
            onContextMenu={(e) => {
              if (longPressTimer.current !== null) e.preventDefault();
            }}
          >
            {/* Rangée des 6 emojis, dans une petite Card au-dessus du bouton */}
            <div
              className={`absolute bottom-full left-0 z-20 mb-2 transition-opacity duration-150 ${
                pickerOpen
                  ? "pointer-events-auto opacity-100"
                  : "pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100"
              }`}
            >
              <Card padding="sm" className="flex items-center gap-1 shadow-lg">
                {REACTION_TYPES.map((type) => (
                  <Button
                    key={type}
                    type="button"
                    variant={userReaction === type ? "primary" : "ghost"}
                    size="sm"
                    className="text-lg leading-none"
                    title={REACTION_META[type].label}
                    aria-label={`Réagir : ${REACTION_META[type].label}`}
                    onClick={() => react(type)}
                    disabled={pending}
                  >
                    {REACTION_META[type].emoji}
                  </Button>
                ))}
              </Card>
            </div>

            {/* Bouton principal : emoji de la réaction active, sinon icône like */}
            <Button
              type="button"
              variant={userReaction ? "primary" : "secondary"}
              size="sm"
              disabled={pending}
              loading={pending}
              className={userReaction ? "neykra-btn-glow" : ""}
              title="Réagir à ce post (survol ou appui long pour les autres réactions)"
              aria-label="Réagir à ce post"
              onClick={() => react(userReaction ?? "like")}
            >
              {userReaction ? (
                <span className="mr-1 text-base leading-none">
                  {REACTION_META[userReaction].emoji}
                </span>
              ) : (
                <svg
                  className="mr-1 h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              )}
              Réagir
            </Button>
          </div>

          <div className="text-sm text-[var(--text-secondary)]">
            {post.comment_count > 0 && (
              <>
                <span className="mr-1">{post.comment_count}</span>
                <span className="text-[var(--text-tertiary)]">commentaires</span>
              </>
            )}
          </div>
        </div>

        {/* Compteurs par type de réaction (seulement ceux ≥ 1) */}
        {activeCounts.length > 0 && (
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {activeCounts
              .map((t) => `${REACTION_META[t].emoji} ${reactions[t]}`)
              .join(" · ")}
          </p>
        )}
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
