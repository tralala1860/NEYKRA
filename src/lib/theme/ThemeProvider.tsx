"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useSupabase } from "@/lib/supabase/provider";
import type { Theme, ColorMode } from "@/lib/theme/types";

interface ThemeContextValue {
  theme: Theme;
  colorMode: ColorMode;
  isLoading: boolean;
  updateTheme: (theme: Theme) => Promise<void>;
  updateColorMode: (mode: ColorMode) => Promise<void>;
  transitionTheme: (theme: Theme, mode: ColorMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const DEFAULT_THEME: Theme = "shonen";
const DEFAULT_MODE: ColorMode = "dark";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const supabase = useSupabase();
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  const [colorMode, setColorMode] = useState<ColorMode>(DEFAULT_MODE);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Charger les préférences du profil au montage
  useEffect(() => {
    async function loadPreferences() {
      if (!supabase) {
        setIsLoading(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("theme_preference, color_mode")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Erreur chargement préférences thème:", error);
        setIsLoading(false);
        return;
      }

      if (profile) {
        setTheme(profile.theme_preference as Theme);
        setColorMode(profile.color_mode as ColorMode);
      }

      setIsLoading(false);
    }

    loadPreferences();
  }, [supabase]);

  // Appliquer les attributs data-theme et data-mode sur la balise html
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("data-theme", theme);
    html.setAttribute("data-mode", colorMode);
  }, [theme, colorMode]);

  const updateTheme = useCallback(
    async (newTheme: Theme) => {
      if (!supabase) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Transition animée
      setIsTransitioning(true);
      setTheme(newTheme);

      // Sauvegarder dans la base
      const { error } = await supabase
        .from("profiles")
        .update({ theme_preference: newTheme })
        .eq("id", user.id);

      if (error) {
        console.error("Erreur mise à jour thème:", error);
        // Revert sur erreur
        setTheme((prev) => prev);
      }

      // Retirer la classe de transition après l'animation
      setTimeout(() => setIsTransitioning(false), 400);
    },
    [supabase]
  );

  const updateColorMode = useCallback(
    async (newMode: ColorMode) => {
      if (!supabase) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Transition animée
      setIsTransitioning(true);
      setColorMode(newMode);

      // Sauvegarder dans la base
      const { error } = await supabase
        .from("profiles")
        .update({ color_mode: newMode })
        .eq("id", user.id);

      if (error) {
        console.error("Erreur mise à jour mode:", error);
        setColorMode((prev) => prev);
      }

      setTimeout(() => setIsTransitioning(false), 400);
    },
    [supabase]
  );

  const transitionTheme = useCallback((newTheme: Theme, newMode: ColorMode) => {
    setIsTransitioning(true);
    setTheme(newTheme);
    setColorMode(newMode);

    setTimeout(() => setIsTransitioning(false), 400);
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        colorMode,
        isLoading,
        updateTheme,
        updateColorMode,
        transitionTheme,
      }}
    >
      {isTransitioning && (
        <style>{`
          html.transitioning {
            transition: background-color 0.4s cubic-bezier(0.4, 0, 0.2, 1),
                        color 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          }
        `}</style>
      )}
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme doit être utilisé dans un ThemeProvider");
  }
  return context;
}