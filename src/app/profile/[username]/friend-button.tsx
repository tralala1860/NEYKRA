// NEYKRA — Bouton d'état de la relation d'amitié sur un profil public.
// Client component : l'état affiché se met à jour immédiatement après chaque
// action (sans rechargement de page) grâce à l'état renvoyé par les Server
// Actions, qui revalident en plus les profils concernés.
// Aucune couleur ni style en dur : uniquement le composant Button et les tokens
// de l'univers actif (règle permanente §6.10).

"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import {
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  sendFriendRequest,
  type FriendActionState,
  type FriendshipState,
} from "@/lib/friends/actions";

type FriendButtonProps = {
  /** Pseudo du profil visité (c'est lui qui identifie la cible d'une demande). */
  profileUsername: string;
  /** État initial de la relation, calculé côté serveur. */
  initialState: FriendshipState;
};

export function FriendButton({
  profileUsername,
  initialState,
}: FriendButtonProps) {
  const [state, setState] = useState<FriendshipState>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const friendshipId = state.friendshipId;

  /** Lance une action, affiche l'erreur éventuelle et met à jour l'état affiché. */
  function run(action: string, call: () => Promise<FriendActionState>) {
    setError(null);
    setPendingAction(action);
    startTransition(async () => {
      const result = await call();
      setPendingAction(null);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.state) {
        setState(result.state);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {state.status === "none" ? (
          <Button
            type="button"
            variant="primary"
            disabled={isPending}
            loading={pendingAction === "send"}
            onClick={() => run("send", () => sendFriendRequest(profileUsername))}
          >
            Ajouter en ami
          </Button>
        ) : null}

        {state.status === "pending_sent" ? (
          <>
            <Button type="button" variant="secondary" disabled>
              Demande envoyée
            </Button>
            {friendshipId ? (
              <Button
                type="button"
                variant="ghost"
                disabled={isPending}
                loading={pendingAction === "cancel"}
                onClick={() =>
                  run("cancel", () => declineFriendRequest(friendshipId))
                }
              >
                Annuler
              </Button>
            ) : null}
          </>
        ) : null}

        {state.status === "pending_received" && friendshipId ? (
          <>
            <Button
              type="button"
              variant="primary"
              disabled={isPending}
              loading={pendingAction === "accept"}
              onClick={() =>
                run("accept", () => acceptFriendRequest(friendshipId))
              }
            >
              Accepter
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={isPending}
              loading={pendingAction === "decline"}
              onClick={() =>
                run("decline", () => declineFriendRequest(friendshipId))
              }
            >
              Refuser
            </Button>
          </>
        ) : null}

        {state.status === "accepted" && friendshipId ? (
          <Button
            type="button"
            variant="secondary"
            disabled={isPending}
            loading={pendingAction === "remove"}
            onClick={() => run("remove", () => removeFriend(friendshipId))}
          >
            Retirer
          </Button>
        ) : null}
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error)]/10 px-3 py-2 text-xs text-[var(--color-error)]"
        >
          {error}
        </div>
      ) : null}
    </div>
  );
}