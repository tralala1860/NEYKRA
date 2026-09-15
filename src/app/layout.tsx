import type { Metadata } from "next";
import { Anton, Inter } from "next/font/google";
import "./globals.css";
import { SupabaseProvider } from "@/lib/supabase/provider";
import { ThemeProvider } from "@/lib/theme";
import { createClient } from "@/lib/supabase/server";
import {
  LEGACY_THEME_TO_UNIVERSE,
  type Universe,
} from "@/lib/theme/types";

const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "NEYKRA",
  description: "NEYKRA — réseau social manga/anime, gratuit et communautaire.",
};

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

/**
 * Normalise theme_preference (tolère les anciennes valeurs shonen/seinen/
 * kawaii via LEGACY_THEME_TO_UNIVERSE) vers un univers valide, "void" sinon.
 */
function normalizeUniverse(value: unknown): Universe {
  if (isUniverse(value)) return value;
  if (
    value === "shonen" ||
    value === "seinen" ||
    value === "kawaii"
  ) {
    return LEGACY_THEME_TO_UNIVERSE[value];
  }
  return "void";
}

/**
 * Univers initial posé dès le HTML : lu côté serveur depuis le profil quand
 * une session existe (pas de requête Supabase si non connecté — getUser()
 * seul, qui lit le cookie local validé par le proxy), "void" en fallback.
 * Évite le flash VOID au rafraîchissement (l'ancien HTML posait "void" en
 * dur et le ThemeProvider ne corrigeait qu'après le montage client).
 */
async function getInitialUniverse(): Promise<Universe> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return "void";
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("theme_preference")
      .eq("id", user.id)
      .single();

    if (error || !profile) {
      return "void";
    }

    return normalizeUniverse(
      (profile as { theme_preference?: unknown }).theme_preference
    );
  } catch {
    return "void";
  }
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const initialUniverse = await getInitialUniverse();

  return (
    <html
      lang="fr"
      className={`${anton.variable} ${inter.variable} h-full antialiased`}
      data-universe={initialUniverse}
      data-theme={initialUniverse}
      data-mode="dark"
    >
      <body className="min-h-full flex flex-col">
        <SupabaseProvider>
          <ThemeProvider initialUniverse={initialUniverse}>
            {children}
          </ThemeProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
