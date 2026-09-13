import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ThemeSelector } from "./ThemeSelector";

export const metadata: Metadata = {
  title: "Paramètres — NEYKRA",
  description: "Personnalise l'apparence de NEYKRA.",
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Rediriger vers /login si non connecté
  if (!user) {
    redirect("/login");
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-display font-bold text-[var(--text-primary)]">
            Paramètres
          </h1>
          <p className="mt-2 text-[var(--text-secondary)]">
            Personnalise l&apos;apparence de NEYKRA à ta convenance.
          </p>
        </div>

        <ThemeSelector />
      </div>
    </main>
  );
}