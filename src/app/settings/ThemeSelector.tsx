"use client";

import { useState, useTransition } from "react";
import { useTheme, type Universe } from "@/lib/theme";
import { updateThemePreference } from "./actions";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/**
 * Les 5 univers NEYKRA (spec section 6.1).
 * Couleurs EXACTES de la spec — chaque carte affiche sa propre identité
 * (bg + accent-1 + accent-2 + text) quel que soit l'univers actif.
 */
const UNIVERSE_CARDS: {
  value: Universe;
  label: string;
  description: string;
  bg: string;
  accent1: string;
  accent2: string;
  text: string;
}[] = [
  {
    value: "void",
    label: "VOID",
    description: "Mystérieuse et puissante",
    bg: "#0A0006",
    accent1: "#E11D48",
    accent2: "#C026D3",
    text: "#F5F3F7",
  },
  {
    value: "neon_tokyo",
    label: "NEON TOKYO",
    description: "Futuriste / cyberpunk",
    bg: "#06080F",
    accent1: "#22D3EE",
    accent2: "#A78BFA",
    text: "#E8F6FA",
  },
  {
    value: "sakura",
    label: "SAKURA",
    description: "Élégante et douce",
    bg: "#FFFBFD",
    accent1: "#F472B6",
    accent2: "#C4B5FD",
    text: "#3B2A35",
  },
  {
    value: "inferno",
    label: "INFERNO",
    description: "Énergique",
    bg: "#0D0704",
    accent1: "#FB923C",
    accent2: "#EF4444",
    text: "#FFF3EA",
  },
  {
    value: "zen",
    label: "ZEN",
    description: "Minimaliste, traditionnelle japonaise",
    bg: "#FAFAF8",
    accent1: "#BC002D",
    accent2: "#1A1A1A",
    text: "#1A1A1A",
  },
];

export function ThemeSelector() {
  // Nouveau système 5 univers : universe + transitionUniverse uniquement.
  // (Ancien : theme / colorMode / updateTheme / updateColorMode — supprimés,
  // chaque univers a un mode de couleur fixe, colonne color_mode retirée.)
  const { universe, transitionUniverse, isLoading } = useTheme();
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const handleUniverseChange = async (next: Universe) => {
    if (isUpdating || next === universe) return;
    setIsUpdating(true);
    setMessage(null);
    // Aperçu immédiat avec le fondu déjà en place (data-universe sur <html>)
    startTransition(() => transitionUniverse(next));
    try {
      // Persistance : Server Action → profiles.theme_preference
      const result = await updateThemePreference(next);
      if (result.error) {
        setMessage("Erreur lors de la mise à jour de l'univers.");
      } else {
        const label =
          UNIVERSE_CARDS.find((u) => u.value === next)?.label ?? next;
        setMessage(`Univers ${label} appliqué avec succès !`);
        setTimeout(() => setMessage(null), 3000);
      }
    } catch {
      setMessage("Erreur lors de la mise à jour de l'univers.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Sélection de l'univers — 5 univers, mode fixe intégré */}
      <section>
        <h2 className="mb-4 text-xl font-display text-[var(--text-primary)]">
          Choisir ton univers
        </h2>
        <p className="mb-6 text-[var(--text-secondary)]">
          Sélectionne l&apos;ambiance qui te correspond le mieux :
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {UNIVERSE_CARDS.map((u) => {
            const isActive = universe === u.value;
            return (
              <Card
                key={u.value}
                hover
                padding="lg"
                variant={isActive ? "featured" : "default"}
                className="cursor-pointer"
                style={{
                  // Ombre décalée nette aux couleurs de CET univers
                  // (pas l'univers actif) + coins nets façon case de BD
                  boxShadow: `4px 4px 0 ${u.accent1}`,
                  borderRadius: 0,
                }}
                onClick={() => !isUpdating && handleUniverseChange(u.value)}
              >
                <div className="flex flex-col items-center gap-4">
                  {/* Aperçu fidèle : vraies couleurs de l'univers */}
                  <div
                    className="flex h-20 w-full flex-col justify-center gap-2 border p-3"
                    style={{
                      backgroundColor: u.bg,
                      borderColor: u.accent1,
                      borderRadius: 0,
                    }}
                  >
                    <div
                      className="h-3 w-3/4"
                      style={{ backgroundColor: u.accent1 }}
                    />
                    <div
                      className="h-3 w-full"
                      style={{ backgroundColor: `${u.accent2}4D` }}
                    />
                    <div
                      className="h-2 w-1/2"
                      style={{ backgroundColor: `${u.text}66` }}
                    />
                  </div>

                  <div className="flex flex-col items-center gap-1 text-center">
                    <span className="font-semibold text-[var(--text-primary)]">
                      {u.label}
                    </span>
                    <span className="text-xs text-[var(--text-secondary)]">
                      {u.description}
                    </span>
                  </div>

                  {isActive ? (
                    <Badge variant="accent" size="sm">
                      <CheckIcon className="mr-1 h-3 w-3" />
                      Activé
                    </Badge>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={isUpdating}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUniverseChange(u.value);
                      }}
                    >
                      Sélectionner
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Message de confirmation */}
      {message && (
        <div
          className="rounded-lg bg-[var(--color-success)]/20 p-3 text-sm text-[var(--color-success)]"
          role="status"
        >
          {message}
        </div>
      )}

      {/* État de chargement */}
      {isLoading && (
        <div className="rounded-lg bg-[var(--color-info)]/20 p-3 text-sm text-[var(--color-info)]">
          Chargement des préférences...
        </div>
      )}
    </div>
  );
}