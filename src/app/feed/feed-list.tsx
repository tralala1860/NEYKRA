// NEYKRA — Liste du fil d'actualité avec pagination « Charger plus » (/feed).
// Composant client : affiche les posts reçus du Server Component parent (page
// initiale) et empile les pages suivantes chargées à la demande via la Server
// Action getMoreFeedPosts (curseur = created_at du dernier post affiché).
// Aucun rechargement de page : le bouton « Charger plus » disparaît quand le
// serveur annonce qu'il n'y a plus rien à charger.

"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { getMoreFeedPosts } from "@/lib/posts/actions";
import type { PostWithAuthor } from "@/lib/posts/types";
import { PostCard } from "./post-card";

type FeedListProps = {
  /** Posts de la page initiale, fournis par le Server Component parent. */
  initialPosts: PostWithAuthor[];
  /** Reste-t-il des posts plus anciens après la page initiale (calcul serveur). */
  initialHasMore: boolean;
  /** L'utilisateur connecté (propriétaire ou non de chaque post). */
  currentUserId: string;
};

export function FeedList({
  initialPosts,
  initialHasMore,
  currentUserId,
}: FeedListProps) {
  // Seules les pages SUPPLÉMENTAIRES sont gardées en état : la page initiale
  // reste pilotée par le serveur (après revalidatePath("/feed"), un nouveau
  // post apparaît donc normalement en tête de liste).
  const [extraPosts, setExtraPosts] = useState<PostWithAuthor[]>([]);
  // Réponse du serveur au dernier « Charger plus » (null tant qu'aucun clic).
  const [serverHasMore, setServerHasMore] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Dédoublonnage défensif : un post publié entre-temps peut se retrouver à la
  // fois dans la page initiale (revalidée) et dans une page supplémentaire.
  const initialIds = new Set(initialPosts.map((p) => p.id));
  const visibleExtras = extraPosts.filter((p) => !initialIds.has(p.id));
  const posts = [...initialPosts, ...visibleExtras];

  // hasMore : tant qu'aucune page supplémentaire n'a été chargée, on suit la
  // valeur calculée par le serveur pour la page initiale.
  const hasMore = serverHasMore ?? initialHasMore;

  function loadMore() {
    const lastPost = posts[posts.length - 1];
    if (!lastPost) return;

    setError(null);
    startTransition(async () => {
      const page = await getMoreFeedPosts(lastPost.created_at);

      if (page.error) {
        setError(page.error);
        return;
      }

      setExtraPosts((prev) => {
        const known = new Set([
          ...initialIds,
          ...prev.map((p) => p.id),
        ]);
        return [...prev, ...page.posts.filter((p) => !known.has(p.id))];
      });
      setServerHasMore(page.hasMore);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          isOwner={post.author_id === currentUserId}
        />
      ))}

      {hasMore ? (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={loadMore}
            disabled={isPending}
            loading={isPending}
          >
            Charger plus
          </Button>
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error)]/10 px-4 py-3 text-sm text-[var(--color-error)]"
        >
          {error}
        </div>
      ) : null}
    </div>
  );
}