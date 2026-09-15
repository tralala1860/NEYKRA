// NEYKRA — Ligne « utilisateur bloqué » de la page /friends (section
// dédiée). Client component : même pattern que friend-request-actions.tsx
// (useTransition + bandeau d'erreur role="alert") ; un déblocage réussi
// fait disparaître la ligne sans rechargement (la Server Action revalide
// /friends et la route de profil en parallèle).
// Le pseudo reste cliquable : le bloqueur peut consulter le profil d'une
// personne qu'il a bloquée (policy profiles_select_blocked_by_me,
// migration 007), avec « Débloquer » sur place.
// Uniquement Button/Card/Badge + tokens (règle §6.10).

"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import {
  unblockUser,
  type BlockActionState,
  type BlockedUserProfile,
} from "@/lib/blocks/actions";

type BlockedUserActionsProps = {
  profile: BlockedUserProfile;
};

export function BlockedUserActions({ profile }: BlockedUserActionsProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  const displayName = profile.display_name?.trim() || profile.username;
  const initial = (displayName[0] ?? "?").toUpperCase();

  if (done) {
    return null;
  }

  function unblock() {
    setError(null);
    startTransition(async () => {
      const result: BlockActionState = await unblockUser(profile.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      setDone(true);
    });
  }

  return (
    <li className="flex flex-col gap-1">
      <div className="flex items-center gap-3">
        <Link
          href={`/profile/${profile.username}`}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-lg transition-opacity hover:opacity-80"
        >
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt={`Avatar de ${displayName}`}
              className="h-10 w-10 shrink-0 rounded-none border-2 border-[var(--border)] object-cover"
            />
          ) : (
            <div
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-[var(--border)] bg-[var(--accent-subtle)] font-display text-base text-[var(--accent)]"
            >
              {initial}
            </div>
          )}
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-[var(--text-primary)]">
              {displayName}
            </span>
            <span className="block truncate text-xs text-[var(--text-secondary)]">
              @{profile.username}
            </span>
          </span>
        </Link>
        <span className="shrink-0">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={isPending}
            loading={isPending}
            onClick={unblock}
          >
            Débloquer
          </Button>
        </span>
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error)]/10 px-3 py-2 text-xs text-[var(--color-error)]"
        >
          {error}
        </div>
      ) : null}
    </li>
  );
}