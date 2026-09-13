// NEYKRA — client Supabase côté navigateur (App Router).
// Session stockée dans les cookies (via @supabase/ssr) pour être lisible
// par le serveur (voir src/lib/supabase/server.ts et src/proxy.ts).
//
// Phase 1 : authentification. Les formulaires passent par des Server Actions
// (src/lib/auth/actions.ts) ; ce client est utilisé par les composants qui
// ont besoin de l'état d'authentification côté navigateur.
"use client";

import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Variables d'environnement Supabase manquantes : " +
      "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY (fichier .env.local)"
  );
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);