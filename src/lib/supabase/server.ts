// NEYKRA — client Supabase côté serveur (Server Components / Server Actions).
// À créer à chaque requête (jamais partagé entre requêtes).
// La session est lue/écrite dans les cookies de la requête ; si un refresh de
// token est nécessaire, les nouveaux cookies sont écrits via setAll — quand le
// contexte le permet (Server Action). Dans un Server Component, l'écriture est
// impossible : le proxy (src/proxy.ts) s'en charge avant le rendu.

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function createClient() {
  // Les variables sont contrôlées ici (inline) pour que TypeScript affine
  // leurs types en string dans le corps de la fonction.
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Variables d'environnement Supabase manquantes : " +
        "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY (fichier .env.local)"
    );
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Appelé depuis un Server Component : impossible d'écrire un cookie.
          // Le refresh de session est géré par src/proxy.ts.
        }
      },
    },
  });
}