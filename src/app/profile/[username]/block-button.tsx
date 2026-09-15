// NEYKRA — Bouton de blocage / déblocage sur une page de profil.
// Client component : même pattern que friend-button.tsx (useTransition +
// état renvoyé par les Server Actions + bandeau d'erreur role="alert").
// Bouton secondary, sobre : le blocage est une action de modération
// personnelle, pas une action mise en avant.
// États :
//   "none"       → « Bloquer » (secondary).
//   "i_blocked"  → « Débloquer » (secondary).
//   "blocked_by" → rien du tout (état neutre — la RLS masque de toute
//                  façon ce profil ; aucun message explicite du type
//                  « vous êtes bloqué », le blocage reste discret).
// Jamais affiché sur son propre profil (garde faite côté page serveur).
// Uniquement Button + tokens (règle §6.10).

"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import {
  blockUser,
  unblockUser,
  type BlockActionState,
  type BlockState,
} from "@/lib/blocks/actions";

type BlockButtonProps = {
  /** Pseudo du profil visité (identifie la cible pour blockUser). */
  profileUsername: string;
  /** Id du profil visité (identifie la cible pour unblockUser). */
  profileId: string;
  /** État initial du blocage, calculé côté serveur. */
  initialState: BlockState;
};

export function BlockButton({
  profileUsername,
  profileId,
  initialState,
}: BlockButtonProps) {
  const [state, setState] = useState<BlockState>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // L'autre a bloqué le visiteur : état volontairement neutre, aucun
  // bouton (et aucun message) — la RLS empêche d'ailleurs déjà l'accès.
  if (state.status === "blocked_by") {
    return null;
  }

  const isBlocked = state.status === "i_blocked";

  function run(call: () => Promise<BlockActionState>) {
    setError(null);
    startTransition(async () => {
      const result = await call();
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
      <Button
        type="button"
        variant="secondary"
        disabled={isPending}
        loading={isPending}
        onClick={() =>
          run(() =>
            isBlocked
              ? unblockUser(profileId)
              : blockUser(profileUsername)
          )
        }
      >
        {isBlocked ? "Débloquer" : "Bloquer"}
      </Button>

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