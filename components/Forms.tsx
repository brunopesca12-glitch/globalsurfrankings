"use client";

import { useActionState } from "react";
import { login, register, type FormState } from "@/app/actions/auth";
import { submitEntry, type EntryState } from "@/app/actions/entry";
import { updateProfile, type ProfileState } from "@/app/actions/profile";

const field = "mt-1 w-full border border-line bg-white px-3 py-2 outline-none focus:border-ocean";
const button = "bg-ocean px-4 py-2 text-paper disabled:opacity-60";

function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null;
  return <p className="border border-stamp/40 bg-white px-3 py-2 text-sm text-stamp">{message}</p>;
}

export function LoginForm() {
  const [state, action, pending] = useActionState(login, { error: null } satisfies FormState);
  return (
    <form action={action} className="space-y-4">
      <ErrorNote message={state.error} />
      <label className="block text-sm">
        Email
        <input className={field} name="email" type="email" autoComplete="email" required />
      </label>
      <label className="block text-sm">
        Password
        <input className={field} name="password" type="password" autoComplete="current-password" required />
      </label>
      <button className={button} type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState(register, { error: null } satisfies FormState);
  return (
    <form action={action} className="space-y-4">
      <ErrorNote message={state.error} />
      <label className="block text-sm">
        Name
        <input className={field} name="displayName" required minLength={2} maxLength={80} />
      </label>
      <label className="block text-sm">
        Email
        <input className={field} name="email" type="email" autoComplete="email" required />
      </label>
      <label className="block text-sm">
        Password
        <input className={field} name="password" type="password" autoComplete="new-password" minLength={8} required />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          Edition
          <select className={field} name="sex" defaultValue="M">
            <option value="M">Men</option>
            <option value="W">Women</option>
          </select>
        </label>
        <label className="block text-sm">
          Date of birth
          <input className={field} name="birthDate" type="date" required />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          Country
          <input className={field} name="country" defaultValue="BR" maxLength={2} required />
        </label>
        <label className="block text-sm">
          City
          <input className={field} name="city" maxLength={80} />
        </label>
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input className="mt-1" type="checkbox" name="pro" />
        <span>Verified Pro — a stub, with no credential check. The door stays open to everyone.</span>
      </label>
      <button className={button} type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create account"}
      </button>
    </form>
  );
}

export function ProfileForm({
  displayName,
  city,
  club,
  country,
  bio,
  hashtags,
}: {
  displayName: string;
  city: string;
  club: string;
  country: string;
  bio: string;
  hashtags: string;
}) {
  const [state, action, pending] = useActionState(updateProfile, { error: null, saved: false } satisfies ProfileState);
  return (
    <form action={action} className="space-y-4">
      <ErrorNote message={state.error} />
      {state.saved ? <p className="text-sm text-ocean">Profile saved.</p> : null}
      <label className="block text-sm">
        Name
        <input className={field} name="displayName" defaultValue={displayName} required />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          City
          <input className={field} name="city" defaultValue={city} />
        </label>
        <label className="block text-sm">
          Club
          <input className={field} name="club" defaultValue={club} />
        </label>
      </div>
      <label className="block text-sm">
        Country
        <input className={field} name="country" defaultValue={country} maxLength={2} required />
      </label>
      <label className="block text-sm">
        Hashtags
        <input className={field} name="hashtags" defaultValue={hashtags} placeholder="ipanema, brazil" />
      </label>
      <label className="block text-sm">
        Note
        <textarea className={field} name="bio" defaultValue={bio} rows={3} maxLength={280} />
      </label>
      <button className={button} type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}

export type ThemeOption = {
  slug: string;
  name: string;
  poolOnly: boolean;
  oceanOnly: boolean;
};

export function EntryForm({
  themes,
  dutyCurrent,
  oceanUsed,
}: {
  themes: ThemeOption[];
  dutyCurrent: boolean;
  oceanUsed: boolean;
}) {
  const [state, action, pending] = useActionState(submitEntry, { error: null } satisfies EntryState);
  return (
    <form action={action} className="space-y-4">
      <ErrorNote message={state.error} />
      {!dutyCurrent ? (
        <p className="border border-stamp/40 bg-white px-3 py-2 text-sm">
          Judging duty is not current. The entry will be refused until the desk marks the queue as current.
        </p>
      ) : null}
      {oceanUsed ? (
        <p className="border border-line bg-white px-3 py-2 text-sm">
          This ISO week&apos;s ocean wave is already in. A pool wave can still enter, with the US$ 20 demonstration toll —
          nothing is charged.
        </p>
      ) : null}
      <label className="block text-sm">
        Event in your category
        <select className={field} name="theme" required defaultValue={themes[0]?.slug}>
          {themes.map((theme) => (
            <option key={theme.slug} value={theme.slug}>
              {theme.name}
              {theme.poolOnly ? " · pool" : ""}
              {theme.oceanOnly ? " · ocean only" : ""}
            </option>
          ))}
        </select>
      </label>
      <fieldset className="text-sm">
        <legend className="mb-2">Environment</legend>
        <label className="mr-4">
          <input className="mr-2" type="radio" name="environment" value="OCEAN" defaultChecked />
          Ocean · US$ 0
        </label>
        <label>
          <input className="mr-2" type="radio" name="environment" value="POOL" />
          Pool · US$ 20 DEMO
        </label>
      </fieldset>
      <label className="block text-sm">
        Video URL
        <input className={field} name="videoUrl" type="url" placeholder="https://" required />
      </label>
      <label className="block text-sm">
        Break
        <input className={field} name="spot" maxLength={80} />
      </label>
      <button className={button} type="submit" disabled={pending || themes.length === 0}>
        {pending ? "Sending…" : "Enter wave"}
      </button>
    </form>
  );
}
