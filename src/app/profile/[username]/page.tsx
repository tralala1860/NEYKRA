import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProfileByUsername } from "@/lib/profile/actions";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProfileLinkButton } from "./profile-link-button";

type ProfilePageProps = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  const result = await getProfileByUsername(decodeURIComponent(username));

  if (!result) {
    return {
      title: "Profil introuvable — NEYKRA",
      description: "Ce profil est introuvable ou privé.",
    };
  }

  const displayName =
    result.profile.display_name?.trim() || result.profile.username;

  return {
    title: `${displayName} (@${result.profile.username}) — NEYKRA`,
    description: `Profil NEYKRA de ${displayName}.`,
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const result = await getProfileByUsername(decodeURIComponent(username));

  if (!result) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-10">
        <Card padding="lg" className="[&>*]:rounded-none">
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="font-display text-xl text-[var(--text-primary)]">
              Profil introuvable
            </p>
            <p className="text-sm text-[var(--text-secondary)]">
              Ce profil est introuvable, privé ou bloqué.
            </p>
            <ProfileLinkButton href="/feed" variant="secondary">
              Retour au fil
            </ProfileLinkButton>
          </div>
        </Card>
      </main>
    );
  }

  const { profile, otakuRank } = result;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwn = user?.id === profile.id;

  const displayName = profile.display_name?.trim() || profile.username;
  const initial = (displayName[0] ?? "?").toUpperCase();
  // Glow autour de l'avatar si statut Otaku actif (NEYKRA_SPEC §8ter).
  const hasOtakuStatus = otakuRank !== null && otakuRank !== "Non-Otaku";

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-10">
      <p className="font-display text-xs tracking-[0.2em] text-[var(--text-tertiary)]">
        01 — PROFIL
      </p>
      <h1 className="neykra-speedlines mt-1 inline-block w-fit font-display text-3xl text-[var(--text-primary)]">
        {displayName}
      </h1>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="text-sm text-[var(--text-secondary)]">
          @{profile.username}
        </span>
        {otakuRank ? <Badge variant="accent">{otakuRank}</Badge> : null}
      </div>

      <div className="mt-6">
        <Card padding="lg" className="[&>*]:rounded-none">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={`Avatar de ${displayName}`}
                className="h-24 w-24 shrink-0 border-2 border-[var(--text-primary)] object-cover"
                style={{
                  borderRadius: 0,
                  boxShadow: hasOtakuStatus
                    ? "3px 3px 0 var(--accent), 0 0 14px var(--accent-glow)"
                    : "3px 3px 0 var(--accent)",
                }}
              />
            ) : (
              <div
                aria-hidden="true"
                className="flex h-24 w-24 shrink-0 items-center justify-center border-2 border-[var(--text-primary)] bg-[var(--accent-subtle)] font-display text-4xl text-[var(--accent)]"
                style={{
                  borderRadius: 0,
                  boxShadow: "3px 3px 0 var(--accent)",
                }}
              >
                {initial}
              </div>
            )}

            <div className="flex min-w-0 flex-1 flex-col gap-3">
              {profile.bio ? (
                <p className="text-sm whitespace-pre-line text-[var(--text-primary)]">
                  {profile.bio}
                </p>
              ) : (
                <p className="text-sm text-[var(--text-tertiary)]">
                  {isOwn
                    ? "Tu n'as pas encore de bio — raconte qui tu es !"
                    : "Aucune bio pour le moment."}
                </p>
              )}

              {isOwn ? (
                <div>
                  <ProfileLinkButton href="/profile/edit" variant="primary">
                    Modifier le profil
                  </ProfileLinkButton>
                </div>
              ) : null}
            </div>
          </div>
        </Card>
      </div>

      <p className="mt-6 text-sm">
        <Link
          href="/feed"
          className="font-medium text-[var(--accent)] underline underline-offset-2 hover:underline-offset-4"
        >
          ← Retour au fil
        </Link>
      </p>
    </main>
  );
}
