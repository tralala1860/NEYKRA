import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";
import { CreatePostForm } from "./create-post-form";
import { FeedList } from "./feed-list";
import { getFeedPosts } from "@/lib/posts/actions";

export const metadata: Metadata = {
  title: "Fil d'actualite — NEYKRA",
  description: "Ton fil d'actualite NEYKRA.",
};

export default async function FeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { posts, hasMore } = await getFeedPosts();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link
            href="/"
            className="font-display text-xl text-[var(--text-primary)] hover:opacity-80 transition-opacity"
          >
            NEYKRA
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/search"
              className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
            >
              Rechercher
            </Link>
            <Link
              href="/friends"
              className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
            >
              Amis
            </Link>
            <Link
              href="/settings"
              className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
            >
              Parametres
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-6">
        <div className="mx-auto max-w-2xl flex flex-col gap-6">
          <CreatePostForm />
          <div className="border-t border-[var(--border)]" />

          {posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="font-display text-4xl text-[var(--accent)]">0</div>
              <h2 className="mt-3 font-display text-lg text-[var(--text-primary)]">
                Aucune publication
              </h2>
              <p className="mt-1 max-w-sm text-sm text-[var(--text-secondary)]">
                Sois le premier a partager quelque chose avec la communaute !
              </p>
            </div>
          ) : (
            <FeedList
              initialPosts={posts}
              initialHasMore={hasMore}
              currentUserId={user.id}
            />
          )}
        </div>
      </main>

      <footer className="mt-auto border-t border-[var(--border)] bg-[var(--surface)] py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 text-xs text-[var(--text-tertiary)]">
          <span>NEYKRA — Reseau social manga</span>
          <span>Parametres &middot; CGU &middot; Confidentialite</span>
        </div>
      </footer>
    </div>
  );
}