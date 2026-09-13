"use client";

import { useFormStatus } from "react-dom";
import { signOut } from "@/lib/auth/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] transition hover:border-[var(--border-hover)] hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Déconnexion…" : "Se déconnecter"}
    </button>
  );
}

export function LogoutButton() {
  return (
    <form action={signOut}>
      <SubmitButton />
    </form>
  );
}