import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";

export const metadata: Metadata = {
  title: "Fil d'actualité — NEYKRA",
  description: "Ton fil d'actualité NEYKRA.",
};

export default async function FeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Double sécurité avec le proxy (src/proxy.ts) : /feed exige une session.
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-6 py-4">
        <Link
          href="/"
          className="text-lg font-display font-bold text-[var(--text-primary)] hover:opacity-80 transition-opacity"
        >
          NEYKRA
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/settings"
            className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
          >
            Paramètres
          </Link>
          <LogoutButton />
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6">
        <h1 className="text-2xl font-display font-bold text-[var(--text-primary)]">
          Fil d&apos;actualité à venir
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Connecté en tant que{" "}
          <span className="font-medium text-[var(--text-primary)]">
            {user.email ?? user.id}
          </span>
        </p>
        <p className="mt-10 max-w-md text-center text-sm text-[var(--text-tertiary)]">
          Le fil d&apos;actualité sera développé en Phase 2 : création de posts,
          likes, commentaires…
        </p>
      </main>
    </div>
  );
}