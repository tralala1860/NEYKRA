// NEYKRA — Formulaire d'ajout d'un commentaire sous un post (/feed).
// Champ texte simple + Button de soumission. Utilise Card pour le conteneur.

"use client";

import { useActionState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { addComment } from "@/lib/posts/actions";
import type { CommentFormState } from "@/lib/posts/types";

type CommentFormProps = {
  postId: string;
};

const INPUT_CLASS =
  "rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]";

export function CommentForm({ postId }: CommentFormProps) {
  const [state, formAction, isPending] = useActionState(
    addComment,
    {} as CommentFormState
  );

  return (
    <Card padding="md" className="mt-3">
      <form action={formAction} className="flex flex-col gap-2">
        <input
          type="hidden"
          name="postId"
          value={postId}
        />

        {state.error ? (
          <div
            role="alert"
            className="rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error)]/10 px-3 py-2 text-xs text-[var(--color-error)]"
          >
            {state.error}
          </div>
        ) : null}

        <div className="flex gap-2">
          <input
            type="text"
            name="content"
            className={INPUT_CLASS}
            placeholder="Ecrire un commentaire..."
            maxLength={2000}
            required
            disabled={isPending}
          />
          <Button
            type="submit"
            size="sm"
            disabled={isPending}
            loading={isPending}
          >
            Envoyer
          </Button>
        </div>
      </form>
    </Card>
  );
}
