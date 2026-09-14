"use client";

import { useActionState } from "react";
import type { CSSProperties } from "react";
import { updateProfile } from "@/lib/profile/actions";
import type { AvatarFormState } from "@/lib/profile/actions";
import type { ProfileFormState } from "@/lib/profile/actions";
import { uploadAvatar } from "@/lib/profile/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const inputClass =
  "rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]";

const textareaClass = `${inputClass} min-h-24 resize-y`;

const initialProfileState: ProfileFormState = {};
const initialAvatarState: AvatarFormState = {};

type EditProfileFormProps = {
  initial: {
    username: string;
    display_name: string;
    bio: string;
    avatar_url: string | null;
  };
};
export function EditProfileForm({ initial }: EditProfileFormProps) {
  const [pState, pAction, pPending] = useActionState(updateProfile, initialProfileState);
  const [aState, aAction, aPending] = useActionState(uploadAvatar, initialAvatarState);
  const preview = aState.avatarUrl ?? initial.avatar_url;
  const nameVal = pState.fields?.display_name ?? initial.display_name;
  const bioVal = pState.fields?.bio ?? initial.bio;
  const firstLetter = (nameVal.trim()[0] ?? initial.username[0] ?? "?").toUpperCase();
  return <AvatarCard preview={preview} firstLetter={firstLetter} aState={aState} aAction={aAction} aPending={aPending} nameVal={nameVal} bioVal={bioVal} pState={pState} pAction={pAction} pPending={pPending} username={initial.username} />;
}

type CardProps2 = {
  preview: string | null;
  firstLetter: string;
  aState: AvatarFormState;
  aAction: (payload: FormData) => void;
  aPending: boolean;
  nameVal: string;
  bioVal: string;
  pState: ProfileFormState;
  pAction: (payload: FormData) => void;
  pPending: boolean;
  username: string;
};

function AvatarCard(p: CardProps2) {
  const square = "[&>*]:rounded-none";
  const imgStyle: CSSProperties = { borderRadius: 0, boxShadow: "3px 3px 0 var(--accent)" };
  return (
    <div className="flex flex-col gap-6">
      <Card padding="lg" className={square}>
        <h2 className="font-display text-lg text-[var(--text-primary)]">Photo de profil</h2>
        <div className="mt-4 flex items-center gap-4">
          {p.preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.preview} alt="Apercu avatar" className="h-20 w-20 border-2 border-[var(--text-primary)] object-cover" style={imgStyle} />
          ) : (
            <div aria-hidden="true" className="flex h-20 w-20 items-center justify-center border-2 border-[var(--text-primary)] bg-[var(--accent-subtle)] font-display text-3xl text-[var(--accent)]" style={imgStyle}>{p.firstLetter}</div>
          )}
          <p className="text-xs text-[var(--text-tertiary)]">PNG, JPEG, WebP ou GIF — 2 Mo maximum.</p>
        </div>
        <form action={p.aAction} className="mt-4 flex flex-col gap-3">
          {p.aState.success ? <div role="status" className="rounded-lg border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 px-4 py-3 text-sm text-[var(--color-success)]">{p.aState.success}</div> : null}
          {p.aState.error ? <div role="alert" className="rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error)]/10 px-4 py-3 text-sm text-[var(--color-error)]">{p.aState.error}</div> : null}
          <input type="file" name="avatar" accept="image/png,image/jpeg,image/webp,image/gif" required className="text-sm text-[var(--text-secondary)]" />
          <div>
            <Button type="submit" variant="secondary" disabled={p.aPending} loading={p.aPending}>{p.aPending ? "Envoi…" : "Envoyer l'avatar"}</Button>
          </div>
        </form>
      </Card>
      <Card padding="lg" className={square}>
        <h2 className="font-display text-lg text-[var(--text-primary)]">Informations</h2>
        <form action={p.pAction} className="mt-4 flex flex-col gap-4">
          {p.pState.success ? <div role="status" className="rounded-lg border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 px-4 py-3 text-sm text-[var(--color-success)]">{p.pState.success}</div> : null}
          {p.pState.error ? <div role="alert" className="rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error)]/10 px-4 py-3 text-sm text-[var(--color-error)]">{p.pState.error}</div> : null}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="edit-username" className="text-sm font-medium text-[var(--text-secondary)]">Nom d&apos;utilisateur</label>
            <input id="edit-username" type="text" value={`@${p.username}`} disabled className={`${inputClass} cursor-not-allowed opacity-60`} />
            <p className="text-xs text-[var(--text-tertiary)]">Le nom d&apos;utilisateur ne peut pas être modifié.</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="edit-display-name" className="text-sm font-medium text-[var(--text-secondary)]">Nom affiché</label>
            <input id="edit-display-name" name="display_name" type="text" maxLength={80} placeholder="Ton pseudo affiché" defaultValue={p.nameVal} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="edit-bio" className="text-sm font-medium text-[var(--text-secondary)]">Bio</label>
            <textarea id="edit-bio" name="bio" maxLength={300} placeholder="Quelques mots sur toi…" defaultValue={p.bioVal} className={textareaClass} />
            <p className="text-xs text-[var(--text-tertiary)]">300 caractères maximum.</p>
          </div>
          <div>
            <Button type="submit" disabled={p.pPending} loading={p.pPending}>{p.pPending ? "Enregistrement…" : "Enregistrer"}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

