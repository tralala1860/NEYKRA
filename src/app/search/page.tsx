// NEYKRA — Page /search : recherche d'utilisateurs (Phase 3, §9bis).
// Server Component protégé comme /feed (redirect /login sans session +
// /search ajouté aux routes protégées de src/proxy.ts).
// V1 volontairement simple : formulaire GET classique vers /search?q=...
// (pas de live search ni d'autocomplete). Les résultats sont rendus côté
// serveur via searchUsers ; la RLS de profiles fait tout le filtrage de
// visibilité (privés non-amis et bloqués/bloquants ne remontent jamais).
// Liste au même pattern visuel que /friends : avatar ou initiale sur fond
// --accent-subtle, pseudo cliquable vers /profile/[username], Badge de rang.
// Uniquement Card/Badge/Button + tokens (règle §6.10).
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { searchUsers, type SearchResultProfile } from "@/lib/search/actions";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Recherche — NEYKRA",
  description: "Recherche des utilisateurs NEYKRA par pseudo ou nom affiché.",
};

// Même style d'input que /login et le formulaire de commentaire (tokens uniquement).
const INPUT_CLASS =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]";

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // État initial (pas de recherche) : q est absent ou vide → on n'affiche
  // ni résultats ni message « aucun résultat », juste le champ vide.
  const query = (q ?? "").trim();
  const hasQuery = query.length > 0;
  const results: SearchResultProfile[] = hasQuery
    ? await searchUsers(query)
    : [];

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-10">
      <p className="font-display text-xs tracking-[0.2em] text-[var(--text-tertiary)]">
        RECHERCHE
      </p>
      <h1 className="neykra-speedlines mt-1 inline-block w-fit font-display text-3xl text-[var(--text-primary)]">
        Rechercher des utilisateurs
      </h1>

      <p className="mt-2 text-sm">
        <Link
          href="/feed"
          className="font-medium text-[var(--accent)] underline underline-offset-2 hover:underline-offset-4"
        >
          ← Retour au fil
        </Link>
      </p>

      {/* Formulaire GET classique : soumission = navigation vers /search?q=...
          (pas de JS requis, pas d'état client, cohérent avec la V1). */}
      <form action="/search" method="get" className="mt-6 flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Pseudo ou nom affiché…"
          maxLength={60}
          minLength={2}
          aria-label="Rechercher un utilisateur"
          autoComplete="off"
          className={INPUT_CLASS}
        />
        <Button type="submit" variant="secondary">
          Rechercher
        </Button>
      </form>
      <p className="mt-2 text-xs text-[var(--text-tertiary)]">
        Tape au moins 2 caractères. Seuls les profils que tu peux voir
        apparaissent.
      </p>

      {hasQuery ? (
        <section className="mt-8">
          <h2 className="font-display text-lg text-[var(--text-primary)]">
            Résultats ({results.length})
          </h2>
          <Card padding="md" className="mt-3 [&>*]:rounded-none">
            {results.length === 0 ? (
              <p className="text-sm text-[var(--text-tertiary)]">
                Aucun utilisateur trouvé.
              </p>
            ) : (
              <ul className="flex flex-col gap-4">
                {results.map((profile) => (
                  <SearchResultRow key={profile.id} profile={profile} />
                ))}
              </ul>
            )}
          </Card>
        </section>
      ) : null}
    </main>
  );
}

/** Une ligne de résultat : même pattern visuel que /friends (avatar ou
    initiale sur fond --accent-subtle, pseudo cliquable, Badge de rang si
    disponible). */
function SearchResultRow({ profile }: { profile: SearchResultProfile }) {
  const displayName = profile.display_name?.trim() || profile.username;
  const initial = (displayName[0] ?? "?").toUpperCase();

  return (
    <li>
      <Link
        href={`/profile/${profile.username}`}
        className="flex items-center gap-3 rounded-lg transition-opacity hover:opacity-80"
      >
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt={`Avatar de ${displayName}`}
            className="h-10 w-10 shrink-0 rounded-none border-2 border-[var(--border)] object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-[var(--border)] bg-[var(--accent-subtle)] font-display text-base text-[var(--accent)]"
          >
            {initial}
          </div>
        )}
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2">
            <span className="block truncate text-sm font-medium text-[var(--text-primary)]">
              {displayName}
            </span>
            {profile.otaku_rank ? (
              <Badge variant="accent" size="sm">
                {profile.otaku_rank}
              </Badge>
            ) : null}
          </span>
          <span className="block truncate text-xs text-[var(--text-secondary)]">
            @{profile.username}
          </span>
        </span>
      </Link>
    </li>
  );
}