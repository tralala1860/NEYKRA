"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp } from "@/lib/auth/actions";
import type { AuthFormState } from "@/lib/auth/actions";

const initialState: AuthFormState = {};

// Date du jour au format YYYY-MM-DD (alignée sur la validation serveur, en UTC).
const todayMax = new Date().toISOString().split("T")[0];

const inputClass =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-500";

export function SignupForm() {
  const [state, formAction, isPending] = useActionState(signUp, initialState);
  const { email, username } = state.fields ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.success ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {state.success}
        </p>
      ) : null}
      {state.error ? (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="signup-email" className="text-sm font-medium text-zinc-700">
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
        <label htmlFor="signup-username" className="text-sm font-medium text-zinc-700">
          Nom d'utilisateur
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
        <label htmlFor="signup-password" className="text-sm font-medium text-zinc-700">
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
        <p className="text-xs text-zinc-500">6 caractères minimum.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="signup-birthdate" className="text-sm font-medium text-zinc-700">
          Date de naissance{" "}
          <span className="font-normal text-zinc-500">(obligatoire)</span>
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
        <p className="text-xs text-zinc-500">
          Elle nous permet de détecter les comptes mineurs : les comptes de
          moins de 18 ans sont automatiquement mis en privé.
        </p>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Création du compte…" : "Créer mon compte"}
      </button>

      <p className="text-center text-sm text-zinc-600">
        Déjà membre ?{" "}
        <Link
          href="/login"
          className="font-medium text-zinc-900 underline underline-offset-2"
        >
          Connecte-toi
        </Link>
      </p>
    </form>
  );
}