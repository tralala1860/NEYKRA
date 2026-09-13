import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Connexion — NEYKRA",
  description: "Connecte-toi à NEYKRA.",
};

type LoginPageProps = {
  searchParams: Promise<{ confirmed?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/feed");

  const { confirmed } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-display font-bold text-[var(--text-primary)]">
          Connexion
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Heureux de te revoir sur NEYKRA.
        </p>

        {confirmed ? (
          <div
            className="mt-4 rounded-lg border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 px-4 py-3 text-sm text-[var(--color-success)]"
            role="status"
          >
            Adresse email confirmée ! Tu peux maintenant te connecter.
          </div>
        ) : null}

        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}