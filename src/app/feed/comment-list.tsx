// NEYKRA — Liste des commentaires sous un post (/feed).
// Les commentaires sont passés via props depuis le Server Component parent.

"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { timeAgo } from "@/lib/posts/time-ago";
import type { CommentWithAuthor } from "@/lib/posts/types";

type CommentListProps = {
  comments: CommentWithAuthor[];
};

export function CommentList({ comments }: CommentListProps) {
  if (comments.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 space-y-3">
      {comments.map((comment) => (
        <div key={comment.id} className="flex items-start gap-3">
          {/* Avatar de l'auteur — la pointe de la bulle vise ce bloc (BD classique) */}
          {comment.author_avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={comment.author_avatar_url}
              alt={comment.author_display_name ?? comment.author_username}
              className="h-10 w-10 shrink-0 rounded-none border-2 border-[var(--border)] object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-[var(--border)] bg-[var(--accent-subtle)] font-display text-base text-[var(--accent)]">
              {(comment.author_display_name?.[0] ?? comment.author_username[0] ?? "?").toUpperCase()}
            </div>
          )}

          {/* Bulle de dialogue manga — pointe vers l'avatar (classe .neykra-bubble) */}
          <Card padding="sm" className="neykra-bubble min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <Link
                href={`/profile/${comment.author_username}`}
                className="font-medium text-sm text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
              >
                {comment.author_display_name ?? comment.author_username}
              </Link>

              <time className="text-[11px] text-[var(--text-tertiary)]">
                {timeAgo(comment.created_at)}
              </time>
            </div>

            {/* Contenu — mêmes tailles/couleurs de texte qu'avant (spec 6.2) */}
            <p className="mt-1 text-sm text-[var(--text-primary)] whitespace-pre-wrap break-words">
              {comment.content}
            </p>
          </Card>
        </div>
      ))}
    </div>
  );
}
