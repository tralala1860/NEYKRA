"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp } from "@/lib/auth/actions";
import type { AuthFormState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";

const initialState: AuthFormState = {};

// Date du jour au format YYYY-MM-DD (alignée sur la validation serveur, en UTC).
const todayMax = new Date().toISOString().split("T")[0];

const inputClass =
  "rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]";

export function SignupForm() {
  const [state, formAction, isPending] = useActionState(signUp, initialState);
  const { email, username } = state.fields ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.success ? (
        <div
          className="rounded-lg border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 px-4 py-3 text-sm text-[var(--color-success)]"
          role="status"
        >
          {state.success}
        </div>
      ) : null}
      {state.error ? (
        <div
          role="alert"
          className="rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error)]/10 px-4 py-3 text-sm text-[var(--color-error)]"
        >
          {state.error}
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="signup-email"
          className="text-sm font-medium text-[var(--text-secondary)]"
        >
          Adresse email
        </label>
        <input
          id="signup-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="toi@exemple.fr"
          defaultValue={email ?? ""}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="signup-username"
          className="text-sm font-medium text-[var(--text-secondary)]"
        >
          Nom d&apos;utilisateur
        </label>
        <input
          id="signup-username"
          name="username"
          type="text"
          autoComplete="username"
          required
          minLength={3}
          maxLength={30}
          pattern="[a-zA-Z0-9_]+"
          placeholder="pseudo_otaku"
          defaultValue={username ?? ""}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="signup-password"
          className="text-sm font-medium text-[var(--text-secondary)]"
        >
          Mot de passe
        </label>
        <input
          id="signup-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          className={inputClass}
        />
        <p className="text-xs text-[var(--text-tertiary)]">6 caractères minimum.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="signup-birthdate"
          className="text-sm font-medium text-[var(--text-secondary)]"
        >
          Date de naissance{" "}
          <span className="font-normal text-[var(--text-tertiary)]">
            (obligatoire)
          </span>
        </label>
        <input
          id="signup-birthdate"
          name="birthdate"
          type="date"
          autoComplete="bday"
          required
          max={todayMax}
          className={inputClass}
        />
        <p className="text-xs text-[var(--text-tertiary)]">
          Elle nous permet de détecter les comptes mineurs : les comptes de
          moins de 18 ans sont automatiquement mis en privé.
        </p>
      </div>

      <Button type="submit" disabled={isPending} loading={isPending}>
        {isPending ? "Création du compte…" : "Créer mon compte"}
      </Button>

      <p className="text-center text-sm text-[var(--text-secondary)]">
        Déjà membre ?{" "}
        <Link
          href="/login"
          className="font-medium text-[var(--accent)] underline underline-offset-2 hover:underline-offset-4"
        >
          Connecte-toi
        </Link>
      </p>
    </form>
  );
}