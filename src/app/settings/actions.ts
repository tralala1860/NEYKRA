"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Nouveaux univers (migration 003) + anciennes valeurs pour compat. */
const UNIVERSE_VALUES = ["void", "neon_tokyo", "sakura", "inferno", "zen"] as const;
type Universe = (typeof UNIVERSE_VALUES)[number];

const LEGACY_TO_UNIVERSE: Record<string, Universe> = {
  shonen: "inferno",
  seinen: "void",
  kawaii: "sakura",
};

function normalizeUniverse(value: string): Universe | null {
  if ((UNIVERSE_VALUES as readonly string[]).includes(value)) {
    return value as Universe;
  }
  const mapped = LEGACY_TO_UNIVERSE[value];
  return mapped ?? null;
}

export async function updateThemePreference(
  theme: string
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non connecté" };
  }

  // Accepte les 5 univers + les 3 anciens thèmes (normalisés).
  const universe = normalizeUniverse(theme);

  if (!universe) {
    return { error: "Thème invalide" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ theme_preference: universe })
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
    .select("theme_preference")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Erreur chargement des préférences:", error);
    return null;
  }

  return profile;
}