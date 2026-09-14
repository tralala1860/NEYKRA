"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn } from "@/lib/auth/actions";
import type { AuthFormState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";

const initialState: AuthFormState = {};

const inputClass =
  "w-full max-w-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="flex w-full flex-col items-center gap-6">
      {state.error ? (
        <div
          role="alert"
          className="w-full rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error)]/10 px-4 py-3 text-sm text-[var(--color-error)]"
        >
          {state.error}
        </div>
      ) : null}

      <div className="flex w-full flex-col items-center gap-1.5">
        <label
          htmlFor="login-email"
          className="w-full max-w-sm text-center text-sm font-medium text-[var(--text-secondary)]"
        >
          Adresse email
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="toi@exemple.fr"
          className={inputClass}
        />
      </div>

      <div className="flex w-full flex-col items-center gap-1.5">
        <label
          htmlFor="login-password"
          className="w-full max-w-sm text-center text-sm font-medium text-[var(--text-secondary)]"
        >
          Mot de passe
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={6}
          className={inputClass}
        />
      </div>

      <Button
        type="submit"
        disabled={isPending}
        loading={isPending}
        className="neykra-btn-hero w-full max-w-sm"
      >
        {isPending ? "Connexion…" : "Se connecter"}
      </Button>

      <p className="w-full text-center text-sm text-[var(--text-secondary)]">
        Pas encore de compte ?{" "}
        <Link
          href="/signup"
          className="font-medium text-[var(--accent)] underline underline-offset-2 hover:underline-offset-4"
        >
          Inscris-toi
        </Link>
      </p>
    </form>
  );
}