// NEYKRA — Server Actions d'authentification (Phase 1).
// Toute la logique (validation + appels Supabase Auth) s'exécute côté serveur :
// les réponses d'erreur sont en français, prêtes à afficher dans les formulaires.

"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isMinor } from "@/lib/auth/age";

export type AuthFormState = {
  error?: string;
  success?: string;
  /** Champs à réafficher en cas d'erreur (jamais le mot de passe). */
  fields?: { email?: string; username?: string };
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PASSWORD_MIN_LENGTH = 6;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;

// ---------------------------------------------------------------- validateurs

function validateEmail(email: string): string | null {
  if (!email) return "L'adresse email est obligatoire.";
  if (!EMAIL_REGEX.test(email)) return "L'adresse email n'est pas valide.";
  return null;
}

function validatePassword(password: string): string | null {
  if (!password) return "Le mot de passe est obligatoire.";
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères.`;
  }
  return null;
}

function validateUsername(username: string): string | null {
  if (!username) return "Le nom d'utilisateur est obligatoire.";
  if (!USERNAME_REGEX.test(username)) {
    return "Le nom d'utilisateur doit contenir entre 3 et 30 caractères (lettres, chiffres ou « _ »), sans espaces.";
  }
  return null;
}

function validateBirthdate(birthdate: string): string | null {
  if (!birthdate) return "La date de naissance est obligatoire.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthdate)) {
    return "La date de naissance est invalide.";
  }

  const date = new Date(`${birthdate}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return "La date de naissance est invalide.";
  }

  const now = new Date();
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  if (date.getTime() > today.getTime()) {
    return "La date de naissance ne peut pas être dans le futur.";
  }
  if (date.getUTCFullYear() < 1900) {
    return "La date de naissance est invalide.";
  }
  return null;
}

// --------------------------------------------------- libellés d'erreur Supabase

type AuthErrorLike = { code?: string; message?: string; status?: number };

function authErrorMessage(error: AuthErrorLike): string {
  const code = error.code ?? "";
  const message = (error.message ?? "").toLowerCase();

  if (
    code === "user_already_exists" ||
    code === "email_exists" ||
    message.includes("already registered") ||
    message.includes("already been registered")
  ) {
    return "Un compte existe déjà avec cette adresse email.";
  }
  if (
    code === "invalid_credentials" ||
    message.includes("invalid login credentials") ||
    message.includes("invalid credentials")
  ) {
    return "Email ou mot de passe incorrect.";
  }
  if (code === "email_not_confirmed" || message.includes("email not confirmed")) {
    return "Tu dois d'abord confirmer ton adresse email (lien reçu par mail).";
  }
  if (
    message.includes("weak password") ||
    message.includes("password should be at least") ||
    message.includes("password must be at least")
  ) {
    return `Le mot de passe est trop faible (${PASSWORD_MIN_LENGTH} caractères minimum).`;
  }
  if (
    error.status === 429 ||
    message.includes("rate limit") ||
    message.includes("too many requests")
  ) {
    return "Trop de tentatives. Attends un instant puis réessaie.";
  }
  if (code === "signup_disabled" || message.includes("signups not allowed")) {
    return "Les inscriptions sont temporairement désactivées.";
  }
  if (
    message.includes("database error saving new user") ||
    message.includes("unable to validate email address")
  ) {
    return "Impossible de créer le compte pour le moment — ce nom d'utilisateur est peut-être déjà pris. Essaie un autre pseudo.";
  }
  return "Une erreur est survenue. Vérifie tes informations et réessaie.";
}

// --------------------------------------------------------------------- helpers

/** Origine absolue de l'app (pour le lien de confirmation d'email). */
async function getAppOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

// --------------------------------------------------------------------- actions

/**
 * Inscription : crée le compte Supabase Auth, puis termine le profil créé
 * automatiquement par le trigger (username + birthdate + is_minor +
 * is_private). is_minor/is_private sont recalculés côté serveur (trigger et
 * ici) — jamais de confiance en la valeur envoyée par le client.
 */
export async function signUp(
  prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const username = String(formData.get("username") ?? "").trim();
  const birthdate = String(formData.get("birthdate") ?? "").trim();

  const fields = { email, username };

  const emailError = validateEmail(email);
  const passwordError = validatePassword(password);
  const usernameError = validateUsername(username);
  const birthdateError = validateBirthdate(birthdate);

  const firstError = emailError ?? passwordError ?? usernameError ?? birthdateError;
  if (firstError) {
    return { error: firstError, fields };
  }

  const origin = await getAppOrigin();
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Métadonnées lues par le trigger handle_new_user_auth (schema.sql) pour
      // remplir la ligne profiles au moment même où auth.users est créé.
      data: { username, birthdate },
      emailRedirectTo: `${origin}/login?confirmed=1`,
    },
  });

  if (error) {
    return { error: authErrorMessage(error), fields };
  }

  // Session immédiate (confirmation d'email désactivée dans le projet
  // Supabase) → on finalise le profil ici. Si la confirmation d'email est
  // activée, data.session est null et le trigger a déjà rempli profiles.
  if (data.session && data.user) {
    const minor = isMinor(birthdate);
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ username, birthdate, is_minor: minor, is_private: minor })
      .eq("id", data.user.id);

    if (profileError) {
      if (profileError.code === "23505") {
        return { error: "Ce nom d'utilisateur est déjà pris.", fields };
      }
      return {
        error:
          "Ton compte a bien été créé, mais la mise à jour de ton profil a échoué. " +
          "Contacte l'équipe NEYKRA si le problème persiste.",
        fields,
      };
    }

    redirect("/feed");
    // `redirect` lève une exception : la suite n'est pas exécutée.
  }

  return {
    success:
      "Compte créé ! Un email de confirmation vient de t'être envoyé. " +
      "Clique sur le lien reçu, puis connecte-toi.",
    fields,
  };
}

/**
 * Connexion : vérifie email + mot de passe et ouvre la session (cookies).
 */
export async function signIn(
  prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const emailError = validateEmail(email);
  const passwordError = !password ? "Le mot de passe est obligatoire." : null;
  const firstError = emailError ?? passwordError;
  if (firstError) {
    return { error: firstError };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: authErrorMessage(error) };
  }

  redirect("/feed");
}

/**
 * Déconnexion : invalide la session côté Supabase, efface les cookies.
 */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("signOut error:", error.message);
  }
  redirect("/login");
}