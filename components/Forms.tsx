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
        E-mail
        <input className={field} name="email" type="email" autoComplete="email" required />
      </label>
      <label className="block text-sm">
        Senha
        <input className={field} name="password" type="password" autoComplete="current-password" required />
      </label>
      <button className={button} type="submit" disabled={pending}>
        {pending ? "Entrando…" : "Entrar"}
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
        Nome
        <input className={field} name="displayName" required minLength={2} maxLength={80} />
      </label>
      <label className="block text-sm">
        E-mail
        <input className={field} name="email" type="email" autoComplete="email" required />
      </label>
      <label className="block text-sm">
        Senha
        <input className={field} name="password" type="password" autoComplete="new-password" minLength={8} required />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          Edição
          <select className={field} name="sex" defaultValue="M">
            <option value="M">Homens</option>
            <option value="W">Mulheres</option>
          </select>
        </label>
        <label className="block text-sm">
          Nascimento
          <input className={field} name="birthDate" type="date" required />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          País
          <input className={field} name="country" defaultValue="BR" maxLength={2} required />
        </label>
        <label className="block text-sm">
          Cidade
          <input className={field} name="city" maxLength={80} />
        </label>
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input className="mt-1" type="checkbox" name="pro" />
        <span>Verified Pro — stub, sem checagem de credencial. A porta continua aberta para todo mundo.</span>
      </label>
      <button className={button} type="submit" disabled={pending}>
        {pending ? "Criando…" : "Criar conta"}
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
      {state.saved ? <p className="text-sm text-ocean">Perfil salvo.</p> : null}
      <label className="block text-sm">
        Nome
        <input className={field} name="displayName" defaultValue={displayName} required />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          Cidade
          <input className={field} name="city" defaultValue={city} />
        </label>
        <label className="block text-sm">
          Clube
          <input className={field} name="club" defaultValue={club} />
        </label>
      </div>
      <label className="block text-sm">
        País
        <input className={field} name="country" defaultValue={country} maxLength={2} required />
      </label>
      <label className="block text-sm">
        Hashtags
        <input className={field} name="hashtags" defaultValue={hashtags} placeholder="ipanema, brasil" />
      </label>
      <label className="block text-sm">
        Nota
        <textarea className={field} name="bio" defaultValue={bio} rows={3} maxLength={280} />
      </label>
      <button className={button} type="submit" disabled={pending}>
        {pending ? "Salvando…" : "Salvar perfil"}
      </button>
    </form>
  );
}

export type ThemeOption = {
  slug: string;
  namePt: string;
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
          Seu dever de julgar não está em dia. A inscrição será recusada até a mesa marcar a fila como corrente.
        </p>
      ) : null}
      {oceanUsed ? (
        <p className="border border-line bg-white px-3 py-2 text-sm">
          A onda de oceano desta semana ISO já entrou. Piscina ainda pode, com o pedágio de demonstração de US$ 20 — sem cobrança.
        </p>
      ) : null}
      <label className="block text-sm">
        Evento da sua categoria
        <select className={field} name="theme" required defaultValue={themes[0]?.slug}>
          {themes.map((theme) => (
            <option key={theme.slug} value={theme.slug}>
              {theme.namePt} — {theme.name}
              {theme.poolOnly ? " · piscina" : ""}
              {theme.oceanOnly ? " · só oceano" : ""}
            </option>
          ))}
        </select>
      </label>
      <fieldset className="text-sm">
        <legend className="mb-2">Ambiente</legend>
        <label className="mr-4">
          <input className="mr-2" type="radio" name="environment" value="OCEAN" defaultChecked />
          Oceano · US$ 0
        </label>
        <label>
          <input className="mr-2" type="radio" name="environment" value="POOL" />
          Piscina · US$ 20 DEMO
        </label>
      </fieldset>
      <label className="block text-sm">
        URL do vídeo
        <input className={field} name="videoUrl" type="url" placeholder="https://" required />
      </label>
      <label className="block text-sm">
        Pico
        <input className={field} name="spot" maxLength={80} />
      </label>
      <button className={button} type="submit" disabled={pending || themes.length === 0}>
        {pending ? "Enviando…" : "Inscrever onda"}
      </button>
    </form>
  );
}
