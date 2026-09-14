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
        <Card key={comment.id} padding="sm" className="items-start gap-3">
          {/* Avatar + auteur */}
          <div className="flex flex-col gap-1 min-w-0">
            <Link
              href={`/profile/${comment.author_username}`}
              className="font-medium text-sm text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors truncate"
            >
              {comment.author_display_name ?? comment.author_username}
            </Link>

            <time className="text-[11px] text-[var(--text-tertiary)]">
              {timeAgo(comment.created_at)}
            </time>
          </div>

          {/* Contenu */}
          <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap break-words flex-1">
            {comment.content}
          </p>
        </Card>
      ))}
    </div>
  );
}
