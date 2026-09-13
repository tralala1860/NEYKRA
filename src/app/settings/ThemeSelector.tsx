"use client";

import { useTheme } from "@/lib/theme";
import {
  THEMES,
  COLOR_MODES,
  type Theme,
  type ColorMode,
} from "@/lib/theme/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useState } from "react";

function MoonIcon({ className }: { className?: string }) {
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
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SunIcon({ className }: { className?: string }) {
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
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

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

export function ThemeSelector() {
  const { theme, colorMode, updateTheme, updateColorMode, isLoading } =
    useTheme();
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleThemeChange = async (newTheme: Theme) => {
    setIsUpdating(true);
    setMessage(null);
    try {
      await updateTheme(newTheme);
      setMessage(`Thème ${newTheme} appliqué avec succès !`);
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage("Erreur lors de la mise à jour du thème.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleModeChange = async (newMode: ColorMode) => {
    setIsUpdating(true);
    setMessage(null);
    try {
      await updateColorMode(newMode);
      setMessage(
        `${newMode === "dark" ? "Mode sombre" : "Mode clair"} appliqué avec succès !`
      );
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage("Erreur lors de la mise à jour du mode.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Sélection du thème */}
      <section>
        <h2 className="mb-4 text-xl font-display text-[var(--text-primary)]">
          Choisir ton thème
        </h2>
        <p className="mb-6 text-[var(--text-secondary)]">
          Sélectionne l'ambiance qui te correspond le mieux :
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          {THEMES.map((t) => {
            const isActive = theme === t.value;
            return (
              <Card
                key={t.value}
                hover
                padding="lg"
                className={`cursor-pointer transition-all duration-200 ${
                  isActive ? "ring-2 ring-[var(--accent)] ring-offset-2" : ""
                }`}
                onClick={() => !isUpdating && handleThemeChange(t.value)}
              >
                <div className="flex flex-col items-center gap-4">
                  {/* Aperçu visuel */}
                  <div
                    className="flex h-20 w-full flex-col gap-2 rounded-lg border p-3"
                    style={{
                      backgroundColor:
                        isActive
                          ? t.value === "shonen"
                            ? colorMode === "dark"
                              ? "#1a1a2e"
                              : "#fff8f0"
                            : t.value === "seinen"
                            ? colorMode === "dark"
                              ? "#0d0d12"
                              : "#f0f0f2"
                            : colorMode === "dark"
                            ? "#1a1525"
                            : "#faf5ff"
                          : "var(--surface)",
                      borderColor: "var(--border)",
                    }}
                  >
                    <div
                      className="flex h-6 items-center justify-center rounded-md font-display text-xs"
                      style={{
                        backgroundColor:
                          t.value === "shonen" && colorMode === "dark"
                            ? "#ff6b35"
                            : t.value === "shonen" && colorMode === "light"
                            ? "#e85d26"
                            : t.value === "seinen" && colorMode === "dark"
                            ? "#4a90d9"
                            : t.value === "seinen" && colorMode === "light"
                            ? "#2c6aaa"
                            : t.value === "kawaii" && colorMode === "dark"
                            ? "#ff8fab"
                            : "#ff6b8a",
                        color: colorMode === "dark" ? "#ffffff" : "#000000",
                      }}
                    >
                      {t.label}
                    </div>
                    <div
                      className="flex h-3 w-full rounded-full"
                      style={{
                        backgroundColor:
                          t.value === "shonen" && colorMode === "dark"
                            ? "rgba(255, 107, 53, 0.3)"
                            : t.value === "shonen" && colorMode === "light"
                            ? "rgba(232, 93, 38, 0.2)"
                            : t.value === "seinen" && colorMode === "dark"
                            ? "rgba(74, 144, 217, 0.3)"
                            : t.value === "seinen" && colorMode === "light"
                            ? "rgba(44, 106, 170, 0.2)"
                            : t.value === "kawaii" && colorMode === "dark"
                            ? "rgba(255, 143, 171, 0.3)"
                            : "rgba(255, 107, 138, 0.2)",
                      }}
                    />
                  </div>

                  <div className="flex flex-col items-center gap-1 text-center">
                    <Badge variant={isActive ? "accent" : "outline"} size="sm">
                      {isActive && <CheckIcon className="mr-1 h-3 w-3" />}
                      {isActive ? "Activé" : "Sélectionner"}
                    </Badge>
                    <span className="font-semibold text-[var(--text-primary)]">
                      {t.label}
                    </span>
                    <span className="text-xs text-[var(--text-secondary)]">
                      {t.description}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

      {/* Sélection du mode couleur */}
      <section>
        <h2 className="mb-4 text-xl font-display text-[var(--text-primary)]">
          Choisir le mode de couleur
        </h2>
        <p className="mb-6 text-[var(--text-secondary)]">
          Bascule entre le mode sombre et le mode clair :
        </p>

        <div className="flex flex-col gap-4 sm:flex-row">
          {COLOR_MODES.map((mode) => {
            const isActive = colorMode === mode.value;
            return (
              <Button
                key={mode.value}
                variant={isActive ? "primary" : "secondary"}
                onClick={() => !isUpdating && handleModeChange(mode.value)}
                disabled={isUpdating}
                className="flex-1"
              >
                {mode.value === "dark" ? (
                  <MoonIcon className="mr-2 h-4 w-4" />
                ) : (
                  <SunIcon className="mr-2 h-4 w-4" />
                )}
                {mode.label}
                {isActive && (
                  <Badge variant="accent" size="sm" className="ml-2">
                    <CheckIcon className="mr-1 h-3 w-3" />
                    Actif
                  </Badge>
                )}
              </Button>
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
      </section>