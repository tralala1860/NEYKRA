"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";

type ProfileLinkButtonProps = {
  href: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
};

/**
 * Bouton de navigation (pages profil : Server Components).
 * Utilise le composant Button (règle §6.10) + navigation client —
 * évite d'imbriquer un <button> dans un <a>.
 */
export function ProfileLinkButton({
  href,
  variant = "primary",
  size = "md",
  children,
}: ProfileLinkButtonProps) {
  const router = useRouter();

  return (
    <Button variant={variant} size={size} onClick={() => router.push(href)}>
      {children}
    </Button>
  );
}
