import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "NEYKRA — réseau social manga & anime",
  description:
    "NEYKRA, le réseau social manga & anime : partage tes coups de cœur, teste ta culture otaku et rencontre ta communauté.",
};

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/feed");
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
        NEYKRA
      </h1>
      <p className="mt-3 max-w-md text-zinc-600">
        Le réseau social manga &amp; anime : partage tes coups de cœur, teste
        ta culture otaku et rencontre ta communauté.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/login"
          className="rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700"
        >
          Se connecter
        </Link>
        <Link
          href="/signup"
          className="rounded-lg border border-zinc-300 bg-white px-6 py-2.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
        >
          Créer un compte
        </Link>
      </div>
    </main>
  );
}
