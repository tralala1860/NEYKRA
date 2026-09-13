"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updateThemePreference(
  theme: string,
  colorMode: string
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non connecté" };
  }

  // Validation des valeurs
  const validThemes = ["shonen", "seinen", "kawaii"];
  const validModes = ["dark", "light"];

  if (!validThemes.includes(theme)) {
    return { error: "Thème invalide" };
  }

  if (!validModes.includes(colorMode)) {
    return { error: "Mode de couleur invalide" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ theme_preference: theme, color_mode: colorMode })
    .eq("id", user.id);

  if (error) {
    console.error("Erreur mise à jour des préférences:", error);
    return { error: "Erreur lors de la mise à jour des préférences" };
  }

  // Révalider le chemin pour que les changements soient visibles
  revalidatePath("/settings");
  revalidatePath("/feed");
  revalidatePath("/login");
  revalidatePath("/signup");

  return {};
}

export async function getProfilePreferences() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("theme_preference, color_mode")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Erreur chargement des préférences:", error);
    return null;
  }

  return profile;
}