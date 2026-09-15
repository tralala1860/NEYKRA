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
import {
  LEGACY_THEME_TO_UNIVERSE,
  type ColorMode,
  type Theme,
  type Universe,
} from "@/lib/theme/types";

const DEFAULT_UNIVERSE: Universe = "void";

const UNIVERSE_VALUES: readonly Universe[] = [
  "void",
  "neon_tokyo",
  "sakura",
  "inferno",
  "zen",
];

function isUniverse(value: unknown): value is Universe {
  return (
    typeof value === "string" &&
    (UNIVERSE_VALUES as readonly string[]).includes(value)
  );
}

/** Ancienne valeur (shonen/seinen/kawaii) → nouvel univers. */
function normalizeUniverse(value: unknown): Universe {
  if (isUniverse(value)) return value;
  if (
    value === "shonen" ||
    value === "seinen" ||
    value === "kawaii"
  ) {
    return LEGACY_THEME_TO_UNIVERSE[value];
  }
  return DEFAULT_UNIVERSE;
}

interface ThemeContextValue {
  /** Univers actif (nouveau système 5 univers). */
  universe: Universe;
  /** @deprecated Alias de `universe` — les composants visuels seront migrés
   *  dans une étape séparée. Les anciennes valeurs shonen/seinen/kawaii sont
   *  normalisées vers leur univers cible. */
  theme: Theme;
  /** @deprecated Chaque univers a un mode fixe (migration 003). Conservé
   *  pour ne pas casser les composants existants. */
  colorMode: ColorMode;
  isLoading: boolean;
  /** Change d'univers (persiste dans profiles.theme_preference). */
  updateUniverse: (universe: Universe) => Promise<void>;
  /** @deprecated Utiliser `updateUniverse`. */
  updateTheme: (theme: Theme) => Promise<void>;
  /** @deprecated No-op conservé pour compatibilité — le mode est fixe par
   *  univers depuis la migration 003. */
  updateColorMode: (mode: ColorMode) => Promise<void>;
  /** @deprecated Utiliser `transitionUniverse`. */
  transitionTheme: (theme: Theme, mode: ColorMode) => void;
  /** Aperçu local d'univers (sans persistance), avec transition animée. */
  transitionUniverse: (universe: Universe) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const DEFAULT_MODE: ColorMode = "dark";

export function ThemeProvider({
  children,
  initialUniverse = DEFAULT_UNIVERSE,
}: {
  children: ReactNode;
  /**
   * Univers déjà posé côté serveur dans le HTML initial (layout) : état
   * initial, jamais écrasé au montage — ne change que sur action réelle
   * (updateUniverse/transitionUniverse) ou si le profil distant diffère.
   */
  initialUniverse?: Universe;
}) {
  const supabase = useSupabase();
  const [universe, setUniverse] = useState<Universe>(initialUniverse);
  const [colorMode] = useState<ColorMode>(DEFAULT_MODE);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Resynchronise avec le profil distant SANS valeur par défaut intermédiaire
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

      // NOTE: color_mode n'est plus sélectionné — colonne supprimée par la
      // migration 003 (requête tolérante : theme_preference uniquement, pour
      // rester compatible avec une base pas encore migrée côté Supabase).
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("theme_preference")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Erreur chargement préférences thème:", error);
        setIsLoading(false);
        return;
      }

      if (profile) {
        const remote = normalizeUniverse(
          (profile as { theme_preference?: unknown }).theme_preference
        );
        // Jamais de retour à une valeur par défaut au montage : l'état vient
        // déjà du serveur ; on n'adopte la valeur distante que si elle
        // diffère réellement (ex. changée sur un autre appareil).
        setUniverse((current) => (current === remote ? current : remote));
      }

      setIsLoading(false);
    }

    loadPreferences();
  }, [supabase]);

  // Appliquer l'attribut data-universe sur la balise html.
  // Compat : on maintient aussi data-theme (= univers) et data-mode="dark"
  // le temps que les composants visuels soient migrés (étape séparée).
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("data-universe", universe);
    html.setAttribute("data-theme", universe);
    html.setAttribute("data-mode", "dark");
  }, [universe]);

  const persistUniverse = useCallback(
    async (next: Universe) => {
      if (!supabase) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const previous = universe;

      // Transition animée
      setIsTransitioning(true);
      setUniverse(next);

      // Sauvegarder dans la base
      const { error } = await supabase
        .from("profiles")
        .update({ theme_preference: next })
        .eq("id", user.id);

      if (error) {
        console.error("Erreur mise à jour univers:", error);
        // Revert sur erreur
        setUniverse(previous);
      }

      // Retirer la classe de transition après l'animation
      setTimeout(() => setIsTransitioning(false), 400);
    },
    [supabase, universe]
  );

  const updateUniverse = useCallback(
    async (next: Universe) => {
      await persistUniverse(next);
    },
    [persistUniverse]
  );

  const updateTheme = useCallback(
    async (newTheme: Theme) => {
      await persistUniverse(normalizeUniverse(newTheme));
    },
    [persistUniverse]
  );

  const updateColorMode = useCallback(async () => {
    // No-op : chaque univers a un mode fixe depuis la migration 003.
    // Conservé pour ne pas casser ThemeSelector (migré à l'étape suivante).
    console.warn(
      "updateColorMode est déprécié : chaque univers a un mode fixe."
    );
  }, []);

  const transitionUniverse = useCallback((next: Universe) => {
    setIsTransitioning(true);
    setUniverse(next);

    setTimeout(() => setIsTransitioning(false), 400);
  }, []);

  const transitionTheme = useCallback(
    (newTheme: Theme) => {
      transitionUniverse(normalizeUniverse(newTheme));
    },
    [transitionUniverse]
  );

  return (
    <ThemeContext.Provider
      value={{
        universe,
        theme: universe,
        colorMode,
        isLoading,
        updateUniverse,
        updateTheme,
        updateColorMode,
        transitionTheme,
        transitionUniverse,
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