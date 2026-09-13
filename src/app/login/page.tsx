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
    <main className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Connexion
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Heureux de te revoir sur NEYKRA.
        </p>

        {confirmed ? (
          <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Adresse email confirmée ! Tu peux maintenant te connecter.
          </p>
        ) : null}

        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}