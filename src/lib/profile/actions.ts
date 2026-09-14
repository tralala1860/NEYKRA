// NEYKRA — Server Actions du profil (Phase 2, étape 1).
// Lecture publique par username, mise à jour du profil et upload d'avatar
// via le bucket Storage "avatars" (voir supabase/migrations/004).

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
};

export type ProfileWithRank = {
  profile: Profile;
  /** Rang otaku (table otaku_status) — null si absent (la page n'affiche rien). */
  otakuRank: string | null;
};

export type ProfileFormState = {
  error?: string;
  success?: string;
  fields?: { display_name?: string; bio?: string };
};

export type AvatarFormState = {
  error?: string;
  success?: string;
  avatarUrl?: string;
};

const DISPLAY_NAME_MAX = 80;
const BIO_MAX = 300;

/**
 * Profil public par username (recherche insensible à la casse).
 * Retourne null si introuvable, privé ou bloqué (la RLS refuse la lecture :
 * on renvoie volontairement la même réponse dans les trois cas).
 * Le rang otaku n'est lisible que par son propriétaire (RLS otaku_status) :
 * absent → null, sans placeholder.
 */
export async function getProfileByUsername(
  username: string
): Promise<ProfileWithRank | null> {
  const clean = username.trim();
  if (!clean) {
    return null;
  }

  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio")
    .eq("username", clean)
    .maybeSingle();

  if (error || !profile) {
    if (error) {
      console.error("getProfileByUsername error:", error.message);
    }
    return null;
  }

  let otakuRank: string | null = null;
  const { data: status } = await supabase
    .from("otaku_status")
    .select("rang")
    .eq("user_id", profile.id)
    .maybeSingle();

  if (status?.rang) {
    otakuRank = status.rang;
  }

  return { profile: profile as Profile, otakuRank };
}

/**
 * Mise à jour du profil de l'utilisateur connecté (display_name + bio).
 * Le username n'est pas modifiable ici (identifiant stable des URLs /profile).
 */
export async function updateProfile(
  _prevState: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non connecté." };
  }

  const displayName = String(formData.get("display_name") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const fields = { display_name: displayName, bio };

  if (displayName.length > DISPLAY_NAME_MAX) {
    return {
      error: `Le nom affiché doit contenir au plus ${DISPLAY_NAME_MAX} caractères.`,
      fields,
    };
  }

  if (bio.length > BIO_MAX) {
    return {
      error: `La bio doit contenir au plus ${BIO_MAX} caractères.`,
      fields,
    };
  }

  const { data: current } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName === "" ? null : displayName,
      bio: bio === "" ? null : bio,
    })
    .eq("id", user.id);

  if (error) {
    console.error("updateProfile error:", error.message);
    return { error: "Erreur lors de la mise à jour du profil.", fields };
  }

  if (current?.username) {
    revalidatePath(`/profile/${current.username}`);
  }
  revalidatePath("/profile/edit");

  return { success: "Profil mis à jour !", fields };
}

const AVATAR_MAX_BYTES = 2 * 1024 * 1024; // 2 Mo
const AVATAR_MIME_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

/**
 * Upload d'un avatar vers le bucket Storage "avatars"
 * (chemin : <userId>/<timestamp>.<ext>) puis mise à jour
 * de profiles.avatar_url avec l'URL publique.
 */
export async function uploadAvatar(
  _prevState: AvatarFormState,
  formData: FormData
): Promise<AvatarFormState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non connecté." };
  }

  const file = formData.get("avatar");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Sélectionne une image à envoyer." };
  }

  if (!AVATAR_MIME_TYPES.includes(file.type)) {
    return { error: "Format accepté : PNG, JPEG, WebP ou GIF." };
  }

  if (file.size > AVATAR_MAX_BYTES) {
    return { error: "L'image doit peser moins de 2 Mo." };
  }

  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : file.type === "image/gif"
          ? "gif"
          : "jpg";

  const path = `${user.id}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    console.error("uploadAvatar error:", uploadError.message);
    if (uploadError.message.toLowerCase().includes("bucket")) {
      return {
        error:
          "Stockage des avatars indisponible (bucket « avatars » manquant — exécuter supabase/migrations/004_avatars_storage.sql).",
      };
    }
    return { error: "Échec de l'envoi de l'image." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  const { data: current } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", user.id);

  if (updateError) {
    console.error("uploadAvatar update error:", updateError.message);
    return { error: "Image envoyée, mais la mise à jour du profil a échoué." };
  }

  if (current?.username) {
    revalidatePath(`/profile/${current.username}`);
  }
  revalidatePath("/profile/edit");

  return { success: "Avatar mis à jour !", avatarUrl: publicUrl };
}
