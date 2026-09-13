// NEYKRA — client Supabase côté navigateur.
// Utilisé par les composants client (App Router).
//
// Phase 0 : simple mise en place du client.
// Les variables sont issues de .env.local (NEXT_PUBLIC_*).
// RLS côté Supabase protège toutes les tables (voir supabase/schema.sql).

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Variables d'environnement Supabase manquantes : " +
      "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY (fichier .env.local)"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);