import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Connexion — NEYKRA",
  description: "Connecte-toi à NEYKRA.",
};

type LoginPageProps = {
  searchParams: Promise<{ confirmed?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/feed");

  const { confirmed } = await searchParams;

  return (
    <main className="neykra-hero flex min-h-screen items-center justify-center px-4 py-10">
      {/* Lignes de vitesse statiques, des 4 coins vers le centre (identité hero) */}
      <div aria-hidden className="neykra-hero-lines neykra-hero-lines--tl" />
      <div aria-hidden className="neykra-hero-lines neykra-hero-lines--tr" />
      <div aria-hidden className="neykra-hero-lines neykra-hero-lines--bl" />
      <div aria-hidden className="neykra-hero-lines neykra-hero-lines--br" />

      <div className="w-full max-w-sm">
        {/* Titre + tache d'encre — même traitement que le hero, échelle réduite */}
        <div className="relative mb-8">
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

          {/* Titre — halo bg par-dessus l'encre pour la lisibilité (même classe que le hero) */}
          <h1 className="neykra-hero-title neykra-title-page relative z-10 mt-2 text-center font-display text-5xl uppercase leading-none tracking-wide text-[var(--text-primary)]">
            Connexion
          </h1>
        </div>

        <p className="mt-4 text-center text-sm text-[var(--text-secondary)]">
          Heureux de te revoir sur NEYKRA.
        </p>

        {confirmed ? (
          <div
            className="mt-4 rounded-lg border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 px-4 py-3 text-sm text-[var(--color-success)]"
            role="status"
          >
            Adresse email confirmée ! Tu peux maintenant te connecter.
          </div>
        ) : null}

        <div className="mt-6">
          <Card padding="lg">
            <LoginForm />
          </Card>
        </div>
      </div>
    </main>
  );
}