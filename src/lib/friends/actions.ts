// NEYKRA — Server Actions des amis (Phase 3, étapes 1-2) : demande,
// acceptation, refus/annulation, retrait (unfriend), lecture de l'état de la
// relation et listes pour la page /friends (getFriendsList,
// getPendingReceived, getPendingSent).
// S'appuie sur la RLS de supabase/schema.sql §6.5 (friendships) :
//   select : user_id = auth.uid() or friend_id = auth.uid()
//   insert : with check (user_id = auth.uid())
//   update : destinataire uniquement (migration 006_friendships_rls.sql)
//   delete : user_id = auth.uid() or friend_id = auth.uid()
// Contraintes de la table : unique (user_id, friend_id), check (user_id <> friend_id)
// et status in ('pending', 'accepted') — il n'existe donc PAS de statut « refusé » :
// un refus (ou une annulation de sa propre demande) supprime la ligne.

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type FriendshipStatus =
  | "none"
  | "pending_sent"
  | "pending_received"
  | "accepted";

export type FriendshipState = {
  status: FriendshipStatus;
  /**
   * Id de la ligne friendships concernée (null si aucune relation).
   * Nécessaire pour accepter, refuser/annuler ou retirer : chaque action
   * revérifie que l'utilisateur est bien partie prenante de cette ligne.
   */
  friendshipId: string | null;
};

export type FriendActionState = {
  error?: string;
  success?: string;
  /** Nouvel état de la relation en cas de succès (l'UI se met à jour sans rechargement). */
  state?: FriendshipState;
};

type FriendshipRow = {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
};

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

const NO_RELATION: FriendshipState = { status: "none", friendshipId: null };

/**
 * Relation existante entre deux utilisateurs, dans un sens ou dans l'autre.
 * La table n'a pas de contrainte d'unicité inversée : une relation peut exister
 * en A→B ou en B→A, les deux sens doivent donc être testés.
 * La RLS (friendships_select) ne laisse voir que les lignes dont on est partie.
 */
async function findRelation(
  supabase: ServerSupabaseClient,
  userId: string,
  otherId: string
): Promise<FriendshipState> {
  const [sent, received] = await Promise.all([
    supabase
      .from("friendships")
      .select("id, user_id, friend_id, status")
      .eq("user_id", userId)
      .eq("friend_id", otherId)
      .maybeSingle(),
    supabase
      .from("friendships")
      .select("id, user_id, friend_id, status")
      .eq("user_id", otherId)
      .eq("friend_id", userId)
      .maybeSingle(),
  ]);

  if (sent.error) {
    console.error("findRelation (sent) error:", sent.error.message);
  }
  if (received.error) {
    console.error("findRelation (received) error:", received.error.message);
  }

  const sentRow = (sent.data ?? null) as FriendshipRow | null;
  const receivedRow = (received.data ?? null) as FriendshipRow | null;

  // Une amitié acceptée prime sur une demande en attente (les deux sens ne
  // peuvent pas être 'accepted' en pratique, on reste défensif).
  if (sentRow?.status === "accepted") {
    return { status: "accepted", friendshipId: sentRow.id };
  }
  if (receivedRow?.status === "accepted") {
    return { status: "accepted", friendshipId: receivedRow.id };
  }
  if (sentRow) {
    return { status: "pending_sent", friendshipId: sentRow.id };
  }
  if (receivedRow) {
    return { status: "pending_received", friendshipId: receivedRow.id };
  }
  return NO_RELATION;
}

/**
 * État complet de la relation entre l'utilisateur connecté et un autre profil
 * (statut + id de la ligne). Utilisé par la page profil pour savoir quoi
 * afficher. Renvoie « none » si personne n'est connecté ou s'il s'agit de soi.
 */
export async function getFriendshipState(
  otherUserId: string
): Promise<FriendshipState> {
  if (!otherUserId) {
    return NO_RELATION;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id === otherUserId) {
    return NO_RELATION;
  }

  return findRelation(supabase, user.id, otherUserId);
}

/** État seul de la relation (api publique minimale). */
export async function getFriendshipStatus(
  otherUserId: string
): Promise<FriendshipStatus> {
  const state = await getFriendshipState(otherUserId);
  return state.status;
}

// ---------------------------------------------------------------------------
// Revalidation des profils concernés
// ---------------------------------------------------------------------------

/**
 * Revalide les profils concernés par un changement de relation.
 * La route dynamique est revalidée en entier (type « page », requis par Next
 * dès que le chemin contient un segment dynamique) : le profil de l'autre
 * partie n'est pas toujours lisible (profil privé après un retrait), son URL ne
 * peut donc pas toujours être reconstruite. Le chemin littéral est revalidé en
 * plus quand on connaît le pseudo (cas de l'envoi d'une demande).
 */
function revalidateProfile(username?: string | null) {
  revalidatePath("/profile/[username]", "page");
  if (username) {
    revalidatePath(`/profile/${username}`);
  }
}

/** Revalide le profil de l'autre partie (pseudo lu si la RLS l'autorise). */
async function revalidateOtherProfile(
  supabase: ServerSupabaseClient,
  otherUserId: string
) {
  const { data } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", otherUserId)
    .maybeSingle();

  const row = (data ?? null) as { username: string } | null;
  revalidateProfile(row?.username ?? null);
}

// ---------------------------------------------------------------------------
// Envoi d'une demande d'ami
// ---------------------------------------------------------------------------

/**
 * Envoie une demande d'ami à partir du pseudo du destinataire.
 * Refuse : non connecté, soi-même, et toute relation déjà existante dans un sens
 * ou l'autre (pending comme accepted) — le double sens est vérifié ici car la
 * table n'a pas de contrainte d'unicité inversée.
 */
export async function sendFriendRequest(
  friendUsername: string
): Promise<FriendActionState> {
  const clean = String(friendUsername ?? "").trim();
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
    console.error("sendFriendRequest profile error:", targetError.message);
    return { error: "Impossible d'envoyer la demande." };
  }

  const target = (targetData ?? null) as {
    id: string;
    username: string;
  } | null;

  if (!target) {
    return { error: "Utilisateur introuvable." };
  }
  if (target.id === user.id) {
    return { error: "Tu ne peux pas t'ajouter toi-même en ami." };
  }

  const relation = await findRelation(supabase, user.id, target.id);

  if (relation.status === "accepted") {
    return { error: "Vous êtes déjà amis." };
  }
  if (relation.status === "pending_sent") {
    return { error: "Demande déjà envoyée — en attente de réponse." };
  }
  if (relation.status === "pending_received") {
    return {
      error: `${target.username} t'a déjà envoyé une demande : accepte-la depuis son profil.`,
    };
  }

  const { data: inserted, error } = await supabase
    .from("friendships")
    .insert({ user_id: user.id, friend_id: target.id, status: "pending" })
    .select("id")
    .single();

  if (error) {
    console.error("sendFriendRequest insert error:", error.message);
    // 23505 = violation de unique (user_id, friend_id) : course entre deux envois.
    if (error.code === "23505") {
      return { error: "Une relation existe déjà avec cet utilisateur." };
    }
    return { error: "Impossible d'envoyer la demande." };
  }

  revalidateProfile(target.username);

  const row = (inserted ?? null) as { id: string } | null;
  return {
    success: "Demande envoyée.",
    state: { status: "pending_sent", friendshipId: row?.id ?? null },
  };
}

// ---------------------------------------------------------------------------
// Acceptation, refus/annulation, retrait
// ---------------------------------------------------------------------------

/**
 * Accepte une demande d'ami reçue. Réservé au DESTINATAIRE (friend_id).
 * Double verrou : filtre `.eq("friend_id", user.id)` + policy RLS
 * friendships_update_recipient (migration 006). Le `.select(...)` final détecte
 * le cas « 0 ligne modifiée » : PostgREST ne renvoie pas d'erreur quand la RLS
 * bloque l'écriture, on validerait donc un faux succès.
 */
export async function acceptFriendRequest(
  friendshipId: string
): Promise<FriendActionState> {
  const clean = String(friendshipId ?? "").trim();
  if (!clean) {
    return { error: "Demande invalide." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non connecté." };
  }

  const { data, error } = await supabase
    .from("friendships")
    .update({ status: "accepted" })
    .eq("id", clean)
    .eq("friend_id", user.id)
    .select("id, user_id, friend_id, status");

  if (error) {
    console.error("acceptFriendRequest error:", error.message);
    return { error: "Impossible d'accepter la demande." };
  }

  const row = (data?.[0] ?? null) as FriendshipRow | null;
  if (!row) {
    return { error: "Demande introuvable ou tu n'en es pas le destinataire." };
  }

  await revalidateOtherProfile(supabase, row.user_id);

  return {
    success: "Demande acceptée.",
    state: { status: "accepted", friendshipId: row.id },
  };
}

/**
 * Supprime une relation dont l'utilisateur est partie prenante, après contrôle
 * du statut attendu. Le schéma n'a pas de statut « refusé »
 * (status in ('pending','accepted')) : refuser une demande reçue — ou annuler sa
 * propre demande envoyée — consiste donc à supprimer la ligne, ce que la policy
 * friendships_delete_participant autorise pour les deux parties.
 * `.select("id")` confirme la suppression réelle (aucune erreur PostgREST sur
 * 0 ligne affectée).
 */
async function deleteParticipantRelation(
  supabase: ServerSupabaseClient,
  friendshipId: string,
  userId: string,
  expectedStatus: "pending" | "accepted",
  invalidStatusMessage: string
): Promise<{ error?: string }> {
  const { data, error } = await supabase
    .from("friendships")
    .select("id, user_id, friend_id, status")
    .eq("id", friendshipId)
    .maybeSingle();

  if (error) {
    console.error("friendship lookup error:", error.message);
    return { error: "Impossible de charger la relation." };
  }

  const row = (data ?? null) as FriendshipRow | null;

  if (!row || (row.user_id !== userId && row.friend_id !== userId)) {
    return { error: "Relation introuvable." };
  }
  if (row.status !== expectedStatus) {
    return { error: invalidStatusMessage };
  }

  const otherUserId = row.user_id === userId ? row.friend_id : row.user_id;

  const { data: deleted, error: deleteError } = await supabase
    .from("friendships")
    .delete()
    .eq("id", friendshipId)
    .select("id");

  if (deleteError) {
    console.error("delete friendship error:", deleteError.message);
    return { error: "Impossible de supprimer la relation." };
  }
  if (!deleted || deleted.length === 0) {
    return { error: "Suppression impossible : la relation n'existe plus." };
  }

  await revalidateOtherProfile(supabase, otherUserId);
  return {};
}

/**
 * Refuse une demande d'ami reçue (destinataire) ou annule une demande envoyée
 * (demandeur) : dans les deux cas la ligne « pending » est supprimée, le
 * demandeur comme le destinataire étant autorisés (RLS delete).
 */
export async function declineFriendRequest(
  friendshipId: string
): Promise<FriendActionState> {
  const clean = String(friendshipId ?? "").trim();
  if (!clean) {
    return { error: "Demande invalide." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non connecté." };
  }

  const result = await deleteParticipantRelation(
    supabase,
    clean,
    user.id,
    "pending",
    "Cette demande a déjà été traitée."
  );

  if (result.error) {
    return { error: result.error };
  }

  return { success: "Demande supprimée.", state: NO_RELATION };
}

/**
 * Retire une amitié acceptée (unfriend) — utilisable par les deux parties
 * (policy friendships_delete_participant).
 */
export async function removeFriend(
  friendshipId: string
): Promise<FriendActionState> {
  const clean = String(friendshipId ?? "").trim();
  if (!clean) {
    return { error: "Amitié invalide." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non connecté." };
  }

  const result = await deleteParticipantRelation(
    supabase,
    clean,
    user.id,
    "accepted",
    "Cette amitié n'existe plus (demande encore en attente)."
  );

  if (result.error) {
    return { error: result.error };
  }

  return { success: "Amitié retirée.", state: NO_RELATION };
}

export type FriendProfile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  /** Rang otaku (table otaku_status) — null si absent ou illisible (RLS). */
  otaku_rank: string | null;
};

export type FriendListEntry = {
  /** Id de la ligne friendships (pour accepter, refuser/annuler, retirer). */
  friendshipId: string;
  /** Profil de l'autre partie de la relation (affichage + lien). */
  profile: FriendProfile;
};

/** Demande en attente : même forme (profil de l'autre partie + id de ligne). */
export type PendingFriendRequest = FriendListEntry;

type FriendProfileRow = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  otaku_status?: { rang: string } | { rang: string }[] | null;
};

function otherIdOf(row: FriendshipRow, userId: string): string {
  return row.user_id === userId ? row.friend_id : row.user_id;
}

/**
 * Profils des autres parties d'une liste de relations, avec rang otaku quand
 * il est lisible. Même pattern de jointure que getFeedPosts/getPostsByAuthor
 * dans src/lib/posts/actions.ts : `profiles (..., otaku_status (rang))`.
 * Les profils illisibles (compte supprimé, privé ou bloqué — la RLS de
 * profiles ne les renvoie pas) sont absents de la map et donc ignorés par les
 * appelants plutôt qu'affichés sans nom.
 */
async function fetchFriendProfiles(
  supabase: ServerSupabaseClient,
  ids: string[]
): Promise<Map<string, FriendProfile>> {
  const byId = new Map<string, FriendProfile>();
  const uniqueIds = [...new Set(ids.filter((id) => Boolean(id)))];

  if (uniqueIds.length === 0) {
    return byId;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, otaku_status (rang)")
    .in("id", uniqueIds);

  if (error) {
    console.error("fetchFriendProfiles error:", error.message);
    return byId;
  }

  for (const row of (data ?? []) as FriendProfileRow[]) {
    const status = row.otaku_status;
    const rank = Array.isArray(status)
      ? (status[0]?.rang ?? null)
      : (status?.rang ?? null);
    byId.set(row.id, {
      id: row.id,
      username: row.username,
      display_name: row.display_name,
      avatar_url: row.avatar_url,
      otaku_rank: rank,
    });
  }

  return byId;
}

/**
 * Amis actuels : relations `accepted` où l'utilisateur connecté est `user_id`
 * OU `friend_id`. Renvoie les profils des autres parties.
 * Non connecté (impossible via la page protégée) : tableau vide.
 */
export async function getFriendsList(): Promise<FriendListEntry[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const [mine, theirs] = await Promise.all([
    supabase
      .from("friendships")
      .select("id, user_id, friend_id, status")
      .eq("user_id", user.id)
      .eq("status", "accepted")
      .order("created_at", { ascending: false }),
    supabase
      .from("friendships")
      .select("id, user_id, friend_id, status")
      .eq("friend_id", user.id)
      .eq("status", "accepted")
      .order("created_at", { ascending: false }),
  ]);

  if (mine.error) {
    console.error("getFriendsList (sent) error:", mine.error.message);
  }
  if (theirs.error) {
    console.error("getFriendsList (received) error:", theirs.error.message);
  }
  if (mine.error || theirs.error) {
    return [];
  }

  const rows = [
    ...((mine.data ?? []) as FriendshipRow[]),
    ...((theirs.data ?? []) as FriendshipRow[]),
  ].filter((row) => row.status === "accepted");

  if (rows.length === 0) {
    return [];
  }

  const byId = await fetchFriendProfiles(
    supabase,
    rows.map((row) => otherIdOf(row, user.id))
  );

  const friends: FriendListEntry[] = [];
  for (const row of rows) {
    const profile = byId.get(otherIdOf(row, user.id));
    if (profile) {
      friends.push({ friendshipId: row.id, profile });
    }
  }

  return friends;
}

/**
 * Demandes reçues en attente : relations `pending` où l'utilisateur connecté
 * est `friend_id`. Profil du demandeur + id de la ligne.
 * Non connecté : tableau vide.
 */
export async function getPendingReceived(): Promise<PendingFriendRequest[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("friendships")
    .select("id, user_id, friend_id, status")
    .eq("friend_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getPendingReceived error:", error.message);
    return [];
  }

  const rows = ((data ?? []) as FriendshipRow[]).filter(
    (row) => row.status === "pending"
  );

  if (rows.length === 0) {
    return [];
  }

  const byId = await fetchFriendProfiles(
    supabase,
    rows.map((row) => row.user_id)
  );

  const received: PendingFriendRequest[] = [];
  for (const row of rows) {
    const profile = byId.get(row.user_id);
    if (profile) {
      received.push({ friendshipId: row.id, profile });
    }
  }

  return received;
}

/**
 * Demandes envoyées en attente : relations `pending` où l'utilisateur
 * connecté est `user_id`. Profil du destinataire + id de la ligne.
 * Non connecté : tableau vide.
 */
export async function getPendingSent(): Promise<PendingFriendRequest[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("friendships")
    .select("id, user_id, friend_id, status")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getPendingSent error:", error.message);
    return [];
  }

  const rows = ((data ?? []) as FriendshipRow[]).filter(
    (row) => row.status === "pending"
  );

  if (rows.length === 0) {
    return [];
  }

  const byId = await fetchFriendProfiles(
    supabase,
    rows.map((row) => row.friend_id)
  );

  const sent: PendingFriendRequest[] = [];
  for (const row of rows) {
    const profile = byId.get(row.friend_id);
    if (profile) {
      sent.push({ friendshipId: row.id, profile });
    }
  }

  return sent;
}