// NEYKRA — Boutons d'action d'une ligne de la page /friends.
// Client component : demande reçue → Accepter (primary) / Refuser
// (secondary), demande envoyée → Annuler (secondary), ami → Retirer
// (secondary, sobre). Chaque action appelle la Server Action existante dans
// un useTransition et fait disparaître la ligne SAUF acceptation réussie
// (la page serveur ne peut pas se mettre à jour sans rechargement : on
// affiche alors « Ami ajouté » à la place des boutons).
// Bandeau d'erreur role="alert" en cas d'échec (même pattern que
// friend-button.tsx). Uniquement Button/Badge et les tokens (règle §6.10).

"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  type FriendActionState,
  type FriendListEntry,
} from "@/lib/friends/actions";

type FriendRequestAction = "accept" | "decline" | "cancel" | "remove";

type FriendRequestActionsProps = {
  entry: FriendListEntry;
  variant: "received" | "sent" | "friend";
};

export function FriendRequestActions({
  entry,
  variant,
}: FriendRequestActionsProps) {
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] =
    useState<FriendRequestAction | null>(null);
  const [done, setDone] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const { profile, friendshipId } = entry;
  const displayName = profile.display_name?.trim() || profile.username;
  const initial = (displayName[0] ?? "?").toUpperCase();

  function run(action: FriendRequestAction, call: () => Promise<FriendActionState>) {
    setError(null);
    setPendingAction(action);
    startTransition(async () => {
      const result = await call();
      setPendingAction(null);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (action === "accept") {
        setAccepted(true);
      } else {
        setDone(true);
      }
    });
  }

  if (done) {
    return null;
  }

  return (
    <li className="flex flex-col gap-1">
      <div className="flex items-center gap-3">
        <FriendLink profile={profile} displayName={displayName} initial={initial} />
        <span className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <ActionButtons
            variant={accepted ? "accepted" : variant}
            isPending={isPending}
            pendingAction={pendingAction}
            friendshipId={friendshipId}
            run={run}
          />
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

function FriendLink({
  profile,
  displayName,
  initial,
}: {
  profile: FriendListEntry["profile"];
  displayName: string;
  initial: string;
}) {
  return (
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
        <span className="flex flex-wrap items-center gap-2">
          <span className="block truncate text-sm font-medium text-[var(--text-primary)]">
            {displayName}
          </span>
          {profile.otaku_rank ? (
            <Badge variant="accent" size="sm">
              {profile.otaku_rank}
            </Badge>
          ) : null}
        </span>
        <span className="block truncate text-xs text-[var(--text-secondary)]">
          @{profile.username}
        </span>
      </span>
    </Link>
  );
}

function ActionButtons({
  variant,
  isPending,
  pendingAction,
  friendshipId,
  run,
}: {
  variant: "received" | "sent" | "friend" | "accepted";
  isPending: boolean;
  pendingAction: FriendRequestAction | null;
  friendshipId: string;
  run: (action: FriendRequestAction, call: () => Promise<FriendActionState>) => void;
}) {
  if (variant === "received") {
    return (
      <>
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={isPending}
          loading={pendingAction === "accept"}
          onClick={() => run("accept", () => acceptFriendRequest(friendshipId))}
        >
          Accepter
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={isPending}
          loading={pendingAction === "decline"}
          onClick={() => run("decline", () => declineFriendRequest(friendshipId))}
        >
          Refuser
        </Button>
      </>
    );
  }

  if (variant === "accepted") {
    return (
      <span className="text-xs text-[var(--text-secondary)]">Ami ajouté</span>
    );
  }

  if (variant === "sent") {
    return (
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={isPending}
        loading={pendingAction === "cancel"}
        onClick={() => run("cancel", () => declineFriendRequest(friendshipId))}
      >
        Annuler
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      disabled={isPending}
      loading={pendingAction === "remove"}
      onClick={() => run("remove", () => removeFriend(friendshipId))}
    >
      Retirer
    </Button>
  );
}

