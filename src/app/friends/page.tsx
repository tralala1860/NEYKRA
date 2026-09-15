// NEYKRA — Page /friends : 3 sections (amis, demandes reçues, demandes
// envoyées) servies par getFriendsList/getPendingReceived/getPendingSent.
// Server Component protégé comme /feed (redirect /login sans session).
// Chaque ligne est un FriendRequestActions (client) avec suppression
// immédiate sans rechargement. Uniquement Card + tokens (§6.10).
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  getFriendsList,
  getPendingReceived,
  getPendingSent,
} from "@/lib/friends/actions";
import { Card } from "@/components/ui/Card";
import { FriendRequestActions } from "./friend-request-actions";

export const metadata: Metadata = {
  title: "Amis — NEYKRA",
  description: "Tes amis et tes demandes d'amis NEYKRA.",
};

export default async function FriendsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [friends, received, sent] = await Promise.all([
    getFriendsList(),
    getPendingReceived(),
    getPendingSent(),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-10">
      <p className="font-display text-xs tracking-[0.2em] text-[var(--text-tertiary)]">
        AMIS
      </p>
      <h1 className="neykra-speedlines mt-1 inline-block w-fit font-display text-3xl text-[var(--text-primary)]">
        Mes amis
      </h1>

      <p className="mt-2 text-sm">
        <Link
          href="/feed"
          className="font-medium text-[var(--accent)] underline underline-offset-2 hover:underline-offset-4"
        >
          ← Retour au fil
        </Link>
      </p>

      <div className="mt-6 flex flex-col gap-8">
        <FriendSection
          title="Mes amis"
          count={friends.length}
          emptyMessage="Aucun ami pour l'instant."
        >
          {friends.map((entry) => (
            <FriendRequestActions
              key={entry.friendshipId}
              entry={entry}
              variant="friend"
            />
          ))}
        </FriendSection>

        <FriendSection
          title="Demandes reçues"
          count={received.length}
          emptyMessage="Aucune demande en attente."
        >
          {received.map((entry) => (
            <FriendRequestActions
              key={entry.friendshipId}
              entry={entry}
              variant="received"
            />
          ))}
        </FriendSection>

        <FriendSection
          title="Demandes envoyées"
          count={sent.length}
          emptyMessage="Aucune demande en attente."
        >
          {sent.map((entry) => (
            <FriendRequestActions
              key={entry.friendshipId}
              entry={entry}
              variant="sent"
            />
          ))}
        </FriendSection>
      </div>
    </main>
  );
}

function FriendSection({
  title,
  count,
  emptyMessage,
  children,
}: {
  title: string;
  count: number;
  emptyMessage: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-lg text-[var(--text-primary)]">
        {title} ({count})
      </h2>
      <Card padding="md" className="mt-3 [&>*]:rounded-none">
        {count === 0 ? (
          <p className="text-sm text-[var(--text-tertiary)]">{emptyMessage}</p>
        ) : (
          <ul className="flex flex-col gap-4">{children}</ul>
        )}
      </Card>
    </section>
  );
}
