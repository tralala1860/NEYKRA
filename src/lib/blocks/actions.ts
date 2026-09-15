// NEYKRA — Server Actions du blocage (Phase 3) : bloquer, débloquer,
// liste des bloqués et état de la relation de blocage pour l'affichage
// conditionnel. Même pattern que src/lib/friends/actions.ts.
// S'appuie sur la RLS de supabase/schema.sql (table blocks, §6.9) :
//   select  : blocker_id = auth.uid() or blocked_id = auth.uid()
//   insert  : blocker_id = auth.uid() (blocks_insert_own)
//   delete  : blocker_id = auth.uid() (blocks_delete_own — migration 007,
//             sans elle un utilisateur ne pouvait JAMAIS se débloquer)
// et sur la policy additive profiles_select_blocked_by_me (migration 007) :
// le bloqueur voit le profil de quelqu'un qu'il a lui-même bloqué
// (nécessaire à getBlockedUsers pour afficher username/display_name/avatar).
//
// Rappel du schéma : unique (blocker_id, blocked_id) + check
// (blocker_id <> blocked_id). Le blocage est DIRECTIONNEL : le bloqué ne
// sait pas qu'il est bloqué (aucun message explicite côté UI).
// is_blocked(target) est bidirectionnelle : un blocage dans un sens masque
// les posts/profils dans les DEUX sens (RLS posts_select / profiles_select /
// post_visible_to_reader).

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type BlockState = {
  /**
   * "none"        : aucun blocage entre les deux comptes.
   * "i_blocked"   : l'utilisateur connecté a bloqué l'autre.
   * "blocked_by"  : l'autre a bloqué l'utilisateur connecté (ne doit
   *                 normalement pas être visible : la RLS masque déjà ce
   *                 profil — état neutre affiché par sécurité).
   */
  status: "none" | "i_blocked" | "blocked_by";
};

export type BlockActionState = {
  error?: string;
  success?: string;
  /** Nouvel état de la relation de blocage en cas de succès. */
  state?: BlockState;
};

export type BlockedUserProfile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

const NO_BLOCK: BlockState = { status: "none" };

/**
 * Revalide la route de profil (dynamique : revalidatePath en mode "page",
 * cf. friends/actions.ts) et /friends où vit la liste des bloqués.
 */
function revalidateBlockedPaths(username?: string | null) {
  revalidatePath("/profile/[username]", "page");
  if (username) {
    revalidatePath(`/profile/${username}`);
  }
  revalidatePath("/friends");
}

// ---------------------------------------------------------------------------
// Bloquer
// ---------------------------------------------------------------------------

/**
 * Bloque l'utilisateur dont le pseudo est passé (résolu → id).
 * Supprime au passage TOUTE relation d'amitié existante (pending ou
 * accepted, quel que soit le sens) : bloqué = aucune interaction.
 * Si la ligne blocks existe déjà (contrainte unique, y compris course
 * entre deux clics), l'action échoue proprement avec un message clair
 * plutôt qu'une erreur brute 23505.
 */
export async function blockUser(
  blockedUsername: string
): Promise<BlockActionState> {
  const clean = String(blockedUsername ?? "").trim();
  if (!clean) {
    return { error: "Utilisateur invalide." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non connecté." };
  }

  const { data: targetData, error: targetError } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("username", clean)
    .maybeSingle();

  if (targetError) {
    console.error("blockUser profile error:", targetError.message);
    return { error: "Impossible de bloquer cet utilisateur." };
  }

  const target = (targetData ?? null) as {
    id: string;
    username: string;
  } | null;

  if (!target) {
    return { error: "Utilisateur introuvable." };
  }
  if (target.id === user.id) {
    return { error: "Tu ne peux pas te bloquer toi-même." };
  }

  // 1. Insertion du blocage (RLS blocks_insert_own : blocker_id = moi).
  const { error } = await supabase
    .from("blocks")
    .insert({ blocker_id: user.id, blocked_id: target.id });

  if (error) {
    if (error.code === "23505") {
      // Contrainte unique (blocker_id, blocked_id) : déjà bloqué.
      return { error: "Cet utilisateur est déjà bloqué." };
    }
    console.error("blockUser insert error:", error.message);
    return { error: "Impossible de bloquer cet utilisateur." };
  }

  // 2. Suppression de TOUTE relation d'amitié (les deux sens, tous
  //    statuts). RLS friendships_delete_participant : les deux parties
  //    peuvent supprimer une ligne qui les concerne.
  const { error: friendshipError } = await supabase
    .from("friendships")
    .delete()
    .or(
      `and(user_id.eq.${user.id},friend_id.eq.${target.id}),` +
        `and(user_id.eq.${target.id},friend_id.eq.${user.id})`
    );

  if (friendshipError) {
    // Non bloquant : le blocage est en place ; on journalise et on
    // continue plutôt que de renvoyer un état partiel à l'utilisateur.
    console.error(
      "blockUser friendship cleanup error:",
      friendshipError.message
    );
  }

  revalidateBlockedPaths(target.username);

  return { success: "Utilisateur bloqué.", state: { status: "i_blocked" } };
}

// ---------------------------------------------------------------------------
// Débloquer
// ---------------------------------------------------------------------------

/**
 * Retire une relation de blocage dont l'utilisateur connecté est le
 * BLOQUEUR (policy blocks_delete_own, migration 007 — c'est la seule
 * direction autorisée : on ne peut pas lever un blocage qu'on subit).
 * Le `.select()` final détecte la ligne réellement supprimée : sans
 * policy DELETE, la RLS renverrait 0 ligne SANS erreur PostgREST
 * (même piège que acceptFriendRequest, session 11).
 */
export async function unblockUser(
  blockedUserId: string
): Promise<BlockActionState> {
  const clean = String(blockedUserId ?? "").trim();
  if (!clean) {
    return { error: "Utilisateur invalide." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non connecté." };
  }

  const { data: deleted, error } = await supabase
    .from("blocks")
    .delete()
    .eq("blocker_id", user.id)
    .eq("blocked_id", clean)
    .select("id");

  if (error) {
    console.error("unblockUser delete error:", error.message);
    return { error: "Impossible de débloquer cet utilisateur." };
  }
  if (!deleted || deleted.length === 0) {
    return { error: "Blocage introuvable : cet utilisateur n'est pas bloqué." };
  }

  // Le pseudo peut être résolu ici : on vient de débloquer, la policy
  // profiles_select_blocked_by_me (OR profiles_select) autorise la lecture.
  const { data } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", clean)
    .maybeSingle();

  const row = (data ?? null) as { username: string } | null;
  revalidateBlockedPaths(row?.username ?? null);

  return { success: "Utilisateur débloqué.", state: NO_BLOCK };
}

// ---------------------------------------------------------------------------
// Liste des bloqués
// ---------------------------------------------------------------------------

/**
 * Profils bloqués par l'utilisateur connecté (id, username, display_name,
 * avatar_url). La policy additive profiles_select_blocked_by_me (migration
 * 007) est ce qui permet de relire ces profils — profiles_select les
 * masque désormais dans les deux sens. Non connecté : tableau vide.
 */
export async function getBlockedUsers(): Promise<BlockedUserProfile[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data: blocksData, error: blocksError } = await supabase
    .from("blocks")
    .select("blocked_id")
    .eq("blocker_id", user.id)
    .order("created_at", { ascending: false });

  if (blocksError) {
    console.error("getBlockedUsers blocks error:", blocksError.message);
    return [];
  }

  const ids = ((blocksData ?? []) as { blocked_id: string }[])
    .map((row) => row.blocked_id)
    .filter((id) => Boolean(id));

  if (ids.length === 0) {
    return [];
  }

  const { data: profilesData, error: profilesError } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", ids);

  if (profilesError) {
    console.error("getBlockedUsers profiles error:", profilesError.message);
    return [];
  }

  return ((profilesData ?? []) as BlockedUserProfile[]).sort(
    // Même ordre que la table blocks : plus récent d'abord.
    (a, b) => ids.indexOf(a.id) - ids.indexOf(b.id)
  );
}

// ---------------------------------------------------------------------------
// État de la relation de blocage (affichage conditionnel)
// ---------------------------------------------------------------------------

/**
 * État du blocage entre l'utilisateur connecté et un autre profil.
 * La RLS blocks_select laisse voir les lignes des deux côtés
 * (blocker_id = moi ou blocked_id = moi), les deux sens sont donc testés.
 * Renvoie "none" si personne n'est connecté ou s'il s'agit de soi.
 */
export async function isBlockedByOrBlocking(
  otherUserId: string
): Promise<BlockState> {
  if (!otherUserId) {
    return NO_BLOCK;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id === otherUserId) {
    return NO_BLOCK;
  }

  const [sent, received] = await Promise.all([
    supabase
      .from("blocks")
      .select("blocked_id")
      .eq("blocker_id", user.id)
      .eq("blocked_id", otherUserId)
      .maybeSingle(),
    supabase
      .from("blocks")
      .select("blocker_id")
      .eq("blocker_id", otherUserId)
      .eq("blocked_id", user.id)
      .maybeSingle(),
  ]);

  if (sent.error) {
    console.error("isBlockedByOrBlocking (sent) error:", sent.error.message);
  }
  if (received.error) {
    console.error(
      "isBlockedByOrBlocking (received) error:",
      received.error.message
    );
  }

  if (sent.data) {
    return { status: "i_blocked" };
  }
  if (received.data) {
    return { status: "blocked_by" };
  }
  return NO_BLOCK;
}