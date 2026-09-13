import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Inscription — NEYKRA",
  description: "Rejoins NEYKRA, le réseau social manga & anime.",
};

export default async function SignupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/feed");

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-display text-[var(--text-primary)]">
          Créer un compte
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Rejoins la communauté NEYKRA en quelques secondes.
        </p>

        <div className="mt-6">
          <SignupForm />
        </div>
      </div>
    </main>
  );
}