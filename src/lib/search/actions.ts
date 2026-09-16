// NEYKRA — Server Actions de la recherche d'utilisateurs (Phase 3, §9bis).
// V1 volontairement simple : recherche ilike sur username ET display_name
// (insensible à la casse, partielle — pas seulement un préfixe), limite 20.
// Réalisée par DEUX requêtes séparées (une par colonne) fusionnées côté
// application : volontairement PAS de `.or()` avec chaîne interpolée — la
// syntaxe de filtre PostgREST utilise `,` comme séparateur de conditions et
// `()` comme groupement, un terme utilisateur contenant ces caractères
// corromprait donc la requête. Deux requêtes éliminent le risque à la
// source ; seul l'échappement ilike (\, %, _) reste nécessaire.
//
// AUCUN filtrage applicatif de visibilité : la RLS de profiles
// (profiles_select + gardes anti-blocage, migration 007) ne renvoie déjà que
// les profils que l'utilisateur connecté a le droit de voir — un compte privé
// non-ami ou un compte bloquant/bloqué (dans un sens ou l'autre) ne peut pas
// remonter dans les résultats, quel que soit le terme cherché. Les requêtes
// ci-dessous laissent donc la base faire le tri.
//
// Le rang otaku est lu via la même jointure `profiles (..., otaku_status
// (rang))` que getFeedPosts/getPostsByAuthor : otaku_status n'étant lisible
// que par son propriétaire (RLS), le champ reste null pour les autres profils
// et le badge n'est simplement pas affiché.

"use server";

import { createClient } from "@/lib/supabase/server";

export type SearchResultProfile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  /** Rang otaku (table otaku_status) — null si absent ou illisible (RLS). */
  otaku_rank: string | null;
};

/** Longueur minimale du terme de recherche (en deçà : tableau vide). */
const MIN_QUERY_LENGTH = 2;
/** Nombre maximum de résultats renvoyés. */
const SEARCH_LIMIT = 20;

type SearchRow = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  otaku_status?: { rang: string } | { rang: string }[] | null;
};

/** Colonnes communes aux deux requêtes (jointure rang otaku identique). */
const SEARCH_COLUMNS = "id, username, display_name, avatar_url, otaku_status (rang)";

/**
 * Échappe les caractères spéciaux du PATTERN SQL ilike (\, % et _) pour que
 * le terme saisi soit comparé littéralement et non interprété comme wildcard
 * (« 100% » ne doit pas tout renvoyer). Les virgules/parenthèses n'ont pas à
 * être traitées ici : aucune chaîne de filtre PostgREST (`.or()`) n'est
 * construite à partir du terme (voir l'en-tête du fichier).
 */
function escapeIlikePattern(term: string): string {
  return term.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/**
 * Recherche d'utilisateurs par pseudo ou nom affiché (partielle, insensible
 * à la casse). L'utilisateur connecté est exclu de ses propres résultats.
 * Deux requêtes (username, display_name) fusionnées : dédoublonnage par id
 * (un profil peut matcher les deux), tri par pseudo, plafonné à 20.
 * Query vide ou trop courte (< 2 caractères) : tableau vide, pas d'erreur.
 * Non connecté : tableau vide (la page /search est protégée comme /feed).
 */
export async function searchUsers(
  query: string
): Promise<SearchResultProfile[]> {
  const clean = String(query ?? "").trim();
  if (clean.length < MIN_QUERY_LENGTH) {
    return [];
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const pattern = `%${escapeIlikePattern(clean)}%`;

  // Deux requêtes distinctes : AUCUNE interpolation du terme dans une
  // chaîne de filtre PostgREST (`,` et `()` y ont un sens syntaxique).
  const [byUsername, byDisplayName] = await Promise.all([
    supabase
      .from("profiles")
      .select(SEARCH_COLUMNS)
      .ilike("username", pattern)
      .neq("id", user.id)
      .order("username", { ascending: true })
      .limit(SEARCH_LIMIT),
    supabase
      .from("profiles")
      .select(SEARCH_COLUMNS)
      .ilike("display_name", pattern)
      .neq("id", user.id)
      .order("username", { ascending: true })
      .limit(SEARCH_LIMIT),
  ]);

  if (byUsername.error) {
    console.error("searchUsers (username) error:", byUsername.error.message);
  }
  if (byDisplayName.error) {
    console.error(
      "searchUsers (display_name) error:",
      byDisplayName.error.message
    );
  }

  // Fusion + dédoublonnage par id (un profil peut matcher les deux colonnes),
  // tri par pseudo croissant, plafond à SEARCH_LIMIT au total.
  const unique = new Map<string, SearchRow>();
  for (const row of [
    ...((byUsername.data ?? []) as SearchRow[]),
    ...((byDisplayName.data ?? []) as SearchRow[]),
  ]) {
    if (!unique.has(row.id)) {
      unique.set(row.id, row);
    }
  }

  const merged = [...unique.values()]
    .sort((a, b) => a.username.localeCompare(b.username))
    .slice(0, SEARCH_LIMIT);

  return merged.map((row) => {
    const status = row.otaku_status;
    const rank = Array.isArray(status)
      ? (status[0]?.rang ?? null)
      : (status?.rang ?? null);
    return {
      id: row.id,
      username: row.username,
      display_name: row.display_name,
      avatar_url: row.avatar_url,
      otaku_rank: rank,
    };
  });
}