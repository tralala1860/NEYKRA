"use client";

import {
  createContext,
  useContext,
  type ReactNode,
  type SupabaseClient,
} from "react";
import { supabase as browserClient } from "./client";

interface SupabaseContextValue {
  supabase: SupabaseClient | null;
}

const SupabaseContext = createContext<SupabaseContextValue>({
  supabase: null,
});

export function SupabaseProvider({ children }: { children: ReactNode }) {
  return (
    <SupabaseContext.Provider value={{ supabase: browserClient }}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error("useSupabase doit être utilisé dans un SupabaseProvider");
  }
  return context.supabase;
}