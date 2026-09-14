import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "NEYKRA — réseau social manga & anime",
  description:
    "NEYKRA, le réseau social manga & anime : partage tes coups de cœur, teste ta culture otaku et rencontre ta communauté.",
};

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/feed");
  }

  return (
    <main className="neykra-hero flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
      {/* Lignes de vitesse statiques, des 4 coins vers le centre */}
      <div aria-hidden className="neykra-hero-lines neykra-hero-lines--tl" />
      <div aria-hidden className="neykra-hero-lines neykra-hero-lines--tr" />
      <div aria-hidden className="neykra-hero-lines neykra-hero-lines--bl" />
      <div aria-hidden className="neykra-hero-lines neykra-hero-lines--br" />

      {/* Titre + tache d'encre */}
      <div className="relative">
        {/* Éclaboussure d'encre organique derrière le titre */}
        <svg
          aria-hidden
          viewBox="0 0 640 280"
          className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[190%] w-[135%] -translate-x-1/2 -translate-y-1/2"
        >
          {/* Tache principale (accent-1) */}
          <path
            fill="var(--neykra-accent-1)"
            opacity="0.85"
            d="M 74 152 C 48 96, 118 34, 208 46 C 262 14, 372 18, 434 56 C 516 62, 580 108, 556 164 C 582 216, 492 254, 408 238 C 340 272, 232 268, 168 234 C 92 244, 46 202, 74 152 Z"
          />
          {/* Contre-tache (accent-2), décalée */}
          <path
            fill="var(--neykra-accent-2)"
            opacity="0.4"
            d="M 128 180 C 116 140, 168 104, 232 112 C 296 92, 396 100, 444 130 C 500 142, 520 176, 488 200 C 500 232, 430 250, 368 240 C 308 258, 216 252, 176 228 C 138 222, 120 202, 128 180 Z"
          />
          {/* Projections d'encre */}
          <circle fill="var(--neykra-accent-1)" opacity="0.7" cx="86" cy="66" r="9" />
          <circle fill="var(--neykra-accent-1)" opacity="0.55" cx="564" cy="70" r="6" />
          <circle fill="var(--neykra-accent-2)" opacity="0.6" cx="604" cy="132" r="10" />
          <circle fill="var(--neykra-accent-1)" opacity="0.5" cx="36" cy="216" r="7" />
          <circle fill="var(--neykra-accent-2)" opacity="0.5" cx="560" cy="252" r="5" />
          <path
            fill="var(--neykra-accent-1)"
            opacity="0.5"
            d="M 596 44 l 14 -18 4 20 z"
          />
          <path
            fill="var(--neykra-accent-2)"
            opacity="0.45"
            d="M 40 100 l 16 -8 -4 18 z"
          />
        </svg>

        {/* Numérotation chapitre */}
        <p className="relative z-10 text-[11px] font-medium uppercase tracking-[0.5em] text-[var(--text-secondary)]">
          Chapitre 01
        </p>

        {/* Titre — halo bg par-dessus l'encre pour la lisibilité sur fonds clairs */}
        <h1 className="neykra-hero-title relative z-10 mt-3 font-display text-7xl uppercase leading-none tracking-wide text-[var(--text-primary)] sm:text-8xl md:text-9xl">
          NEYKRA
        </h1>
      </div>

      {/* Sous-titre façon surlignage au marqueur */}
      <p className="neykra-highlight mt-10 px-5 py-1.5 font-display text-lg text-[var(--neykra-on-accent)] sm:text-xl">
        Le réseau social manga &amp; anime
      </p>

      {/* Texte explicatif — sobre, lisible */}
      <p className="mt-5 max-w-md text-sm leading-relaxed text-[var(--text-secondary)]">
        Partage tes coups de cœur, teste ta culture otaku et rencontre ta
        communauté.
      </p>

      {/* Boutons angulaires, bordure coup de pinceau */}
      <div className="mt-10 flex flex-col items-center gap-5 sm:flex-row">
        <Link href="/login" className="w-full sm:w-auto">
          <Button variant="primary" size="lg" className="neykra-btn-hero w-full sm:w-auto">
            Se connecter
          </Button>
        </Link>
        <Link href="/signup" className="w-full sm:w-auto">
          <Button variant="secondary" size="lg" className="neykra-btn-hero w-full sm:w-auto">
            Créer un compte
          </Button>
        </Link>
      </div>
    </main>
  );
}
