import type { Metadata } from "next";
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
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4">
        <span className="text-lg font-bold tracking-tight text-zinc-900">
          NEYKRA
        </span>
        <LogoutButton />
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6">
        <h1 className="text-2xl font-bold text-zinc-900">
          Fil d'actualité à venir
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Connecté en tant que{" "}
          <span className="font-medium text-zinc-800">
            {user.email ?? user.id}
          </span>
        </p>
        <p className="mt-10 max-w-md text-center text-sm text-zinc-500">
          Le fil d'actualité sera développé en Phase 2 : création de posts,
          likes, commentaires…
        </p>
      </main>
    </div>
  );
}