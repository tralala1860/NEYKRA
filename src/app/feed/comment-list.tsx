// NEYKRA — Liste des commentaires sous un post (/feed).
// Les commentaires sont passés via props depuis le Server Component parent.
// Le bouton de suppression n'apparaît que sur SES propres commentaires : la RLS
// comments_delete_own (for delete using author_id = auth.uid()) n'autorise que
// l'auteur du commentaire à le supprimer — l'auteur du post n'a pas ce droit.

"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { deleteComment } from "@/lib/posts/actions";
import { timeAgo } from "@/lib/posts/time-ago";
import type { CommentWithAuthor } from "@/lib/posts/types";

type CommentListProps = {
  comments: CommentWithAuthor[];
  /** Id de l'utilisateur connecté (absent/null si visiteur non connecté). */
  currentUserId?: string | null;
};

export function CommentList({ comments, currentUserId }: CommentListProps) {
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  // Retrait local confirmé par le serveur : la suppression est déjà propagée par
  // revalidatePath("/feed"), mais un post chargé via « Charger plus » garde ses
  // commentaires en état client — sans ce retrait, le commentaire supprimé
  // resterait affiché jusqu'au prochain rechargement de la page.
  const [deletedIds, setDeletedIds] = useState<string[]>([]);

  const visibleComments = comments.filter((c) => !deletedIds.includes(c.id));

  function remove(commentId: string) {
    setError(null);
    setPendingId(commentId);
    startTransition(async () => {
      const result = await deleteComment(commentId);
      setPendingId(null);
      if (result.error) {
        setError(result.error);
        return;
      }
      setDeletedIds((prev) => [...prev, commentId]);
    });
  }

  if (visibleComments.length === 0 && !error) {
    return null;
  }

  return (
    <div className="mt-2 space-y-3">
      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error)]/10 px-3 py-2 text-xs text-[var(--color-error)]"
        >
          {error}
        </div>
      ) : null}

      {visibleComments.map((comment) => (
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

            {/* Suppression — même pattern sobre que la suppression de post
                (post-card.tsx) et seulement sur son propre commentaire. */}
            {currentUserId && comment.author_id === currentUserId ? (
              <div className="mt-1 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-[var(--color-error)] hover:bg-[var(--color-error)]/10"
                  disabled={pendingId === comment.id}
                  onClick={() => remove(comment.id)}
                >
                  {pendingId === comment.id ? "Suppression…" : "Supprimer"}
                </Button>
              </div>
            ) : null}
          </Card>
        </div>
      ))}
    </div>
  );
}
