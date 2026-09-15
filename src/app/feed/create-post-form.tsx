// NEYKRA — Formulaire de création de post (/feed).
// Zone de texte + upload optionnel de média (image/video/GIF) vers le bucket
// Storage "posts". Utilise Card pour le conteneur, Button pour la publication.

"use client";

import { useActionState, useRef, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { createPost } from "@/lib/posts/actions";
import type { CreatePostFormState } from "@/lib/posts/types";

const TEXTAREA_CLASS =
  "rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] resize-y min-h-[120px]";

export function CreatePostForm() {
  const [state, formAction, isPending] = useActionState(
    createPost,
    {} as CreatePostFormState
  );
  const mediaRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <Card padding="lg" className="w-full max-w-2xl">
      <h2 className="font-display text-lg text-[var(--text-primary)]">
        Nouvelle publication
      </h2>

      <form action={formAction} className="mt-4 flex flex-col gap-4">
        {state.error ? (
          <div
            role="alert"
            className="rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error)]/10 px-4 py-3 text-sm text-[var(--color-error)]"
          >
            {state.error}
          </div>
        ) : null}

        {state.success ? (
          <div
            role="status"
            className="rounded-lg border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 px-4 py-3 text-sm text-[var(--color-success)]"
          >
            {state.success}
          </div>
        ) : null}

        <textarea
          name="content"
          className={TEXTAREA_CLASS}
          placeholder="Quoi de neuf ?"
          maxLength={2000}
          rows={3}
          required
        />

        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={mediaRef}
            type="file"
            name="media"
            accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm"
            className="hidden"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => mediaRef.current?.click()}
          >
            Choisir une photo
          </Button>
          {fileName ? (
            <span className="max-w-full truncate text-xs text-[var(--text-secondary)]">
              {fileName}
            </span>
          ) : null}

          <p className="text-xs text-[var(--text-tertiary)]">
            PNG, JPEG, WebP, GIF, MP4 ou WebM — 5 Mo maximum
          </p>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isPending}
            loading={isPending}
            size="lg"
          >
            {isPending ? "Publication…" : "Publier"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
