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
          <defs>
            {/* Tache principale : encre accent-1 opaque au cœur qui se dilue vers accent-2 en périphérie */}
            <radialGradient
              id="neykra-ink-main"
              gradientUnits="userSpaceOnUse"
              cx="320"
              cy="140"
              r="300"
            >
              <stop offset="0%" stopColor="var(--neykra-accent-1)" stopOpacity="0.95" />
              <stop offset="55%" stopColor="var(--neykra-accent-1)" stopOpacity="0.8" />
              <stop offset="85%" stopColor="var(--neykra-accent-2)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--neykra-accent-2)" stopOpacity="0.05" />
            </radialGradient>
            {/* Contre-tache : accent-2 qui se fond vers l'invisible, façon lavis */}
            <linearGradient
              id="neykra-ink-second"
              gradientUnits="userSpaceOnUse"
              x1="156"
              y1="116"
              x2="470"
              y2="240"
            >
              <stop offset="0%" stopColor="var(--neykra-accent-2)" stopOpacity="0.6" />
              <stop offset="60%" stopColor="var(--neykra-accent-2)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--neykra-accent-1)" stopOpacity="0.05" />
            </linearGradient>
            {/* Lettrage pinceau : déplacement organique des contours (titre de marque) */}
            <filter id="neykra-brush" x="-10%" y="-10%" width="120%" height="120%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.012 0.08"
                numOctaves="2"
                seed="7"
                result="neykra-brush-noise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="neykra-brush-noise"
                scale="7"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>

          {/* Tache principale : contours asymétriques, épaisseur variable façon pinceau */}
          <path
            fill="url(#neykra-ink-main)"
            d="M 64 156 C 34 108, 92 42, 182 40 C 214 10, 336 2, 400 34 C 474 20, 568 72, 556 132 C 606 154, 584 218, 514 228 C 496 268, 398 282, 330 252 C 268 284, 168 270, 138 232 C 74 244, 36 202, 64 156 Z"
          />
          {/* Contre-tache (lavis accent-2 → transparent), décalée et dissymétrique */}
          <path
            fill="url(#neykra-ink-second)"
            d="M 156 184 C 140 148, 200 116, 268 122 C 338 102, 424 114, 464 140 C 506 156, 498 194, 454 204 C 450 232, 384 246, 322 232 C 264 248, 182 226, 156 184 Z"
          />
          {/* Bavures fines qui partent du corps principal (pas de projections rondes) */}
          <path
            fill="url(#neykra-ink-main)"
            d="M 92 46 C 120 30, 152 32, 164 44 C 146 50, 114 56, 92 46 Z"
          />
          <path
            fill="url(#neykra-ink-main)"
            d="M 566 100 C 598 92, 622 100, 630 114 C 606 112, 582 108, 566 100 Z"
          />
          <path
            fill="url(#neykra-ink-main)"
            d="M 148 252 C 178 266, 204 266, 216 258 C 198 252, 168 246, 148 252 Z"
          />
          <path
            fill="url(#neykra-ink-main)"
            d="M 30 118 q 24 -8 40 0 q -22 6 -40 0 Z"
          />
          <path
            fill="url(#neykra-ink-second)"
            d="M 480 66 C 502 58, 524 62, 532 72 C 516 74, 494 72, 480 66 Z"
          />
          {/* Gouttes irrégulières, groupées, tailles variées */}
          <circle fill="var(--neykra-accent-1)" opacity="0.8" cx="212" cy="16" r="3" />
          <circle fill="var(--neykra-accent-1)" opacity="0.6" cx="236" cy="10" r="2" />
          <circle fill="var(--neykra-accent-2)" opacity="0.65" cx="452" cy="22" r="4" />
          <circle fill="var(--neykra-accent-2)" opacity="0.5" cx="614" cy="172" r="3" />
          <circle fill="var(--neykra-accent-1)" opacity="0.7" cx="28" cy="242" r="5" />
          <circle fill="var(--neykra-accent-1)" opacity="0.5" cx="48" cy="262" r="2.5" />
          <circle fill="var(--neykra-accent-2)" opacity="0.55" cx="268" cy="268" r="2" />
        </svg>

        {/* Titre — halo bg par-dessus l'encre pour la lisibilité sur fonds clairs */}
        <h1 className="neykra-hero-title neykra-title-brand relative z-10 mt-3 font-display text-7xl uppercase leading-none tracking-wide text-[var(--text-primary)] sm:text-8xl md:text-9xl">
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
