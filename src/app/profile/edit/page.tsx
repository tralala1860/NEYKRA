import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditProfileForm } from "./edit-form";

export const metadata: Metadata = {
  title: "Modifier le profil — NEYKRA",
  description: "Modifie ton nom affiché, ta bio et ton avatar NEYKRA.",
};

export default async function EditProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, bio, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.username) {
    redirect("/feed");
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-10">
      <p className="font-display text-xs tracking-[0.2em] text-[var(--text-tertiary)]">
        01 — PROFIL
      </p>
      <h1 className="neykra-speedlines mt-1 inline-block w-fit font-display text-3xl text-[var(--text-primary)]">
        Modifier le profil
      </h1>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        Personnalise ton identité NEYKRA.
      </p>

      <div className="mt-6">
        <EditProfileForm
          initial={{
            username: profile.username,
            display_name: profile.display_name ?? "",
            bio: profile.bio ?? "",
            avatar_url: profile.avatar_url,
          }}
        />
      </div>

      <p className="mt-6 text-sm">
        <Link
          href={`/profile/${profile.username}`}
          className="font-medium text-[var(--accent)] underline underline-offset-2 hover:underline-offset-4"
        >
          ← Retour à mon profil
        </Link>
      </p>
    </main>
  );
}
