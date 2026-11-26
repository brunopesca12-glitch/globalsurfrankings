"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { login, register, type FormState } from "@/app/actions/auth";
import { requestPasswordReset, resetPassword } from "@/app/actions/password";
import { submitEntry, type EntryState } from "@/app/actions/entry";
import { updateProfile, type ProfileState } from "@/app/actions/profile";
import { parseVideoUrl } from "@/lib/entry-rules";
import { dutyStatusLine } from "@/lib/tribunal";

const field = "mt-1 w-full border border-line bg-white px-3 py-2 outline-none focus:border-ocean";
const button = "bg-ocean px-4 py-2 text-paper disabled:opacity-60";

function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null;
  return <p className="border border-stamp/40 bg-white px-3 py-2 text-sm text-stamp">{message}</p>;
}

function useSubmitLock(state: { error: string | null }) {
  const lock = useRef(false);
  const [locked, setLocked] = useState(false);
  useEffect(() => {
    lock.current = false;
    setLocked(false);
  }, [state]);
  function guard(formData: FormData, submit: (formData: FormData) => void) {
    if (lock.current) return;
    lock.current = true;
    setLocked(true);
    submit(formData);
  }
  return { locked, guard };
}

export function LoginForm({ callbackUrl = "" }: { callbackUrl?: string }) {
  const [state, action, pending] = useActionState(login, { error: null } satisfies FormState);
  const { locked, guard } = useSubmitLock(state);
  return (
    <form action={(formData) => guard(formData, action)} className="space-y-4">
      <ErrorNote message={state.error} />
      {callbackUrl ? <input type="hidden" name="callbackUrl" value={callbackUrl} /> : null}
      <label className="block text-sm">
        Email
        <input className={field} name="email" type="email" autoComplete="email" required />
      </label>
      <label className="block text-sm">
        Password
        <input className={field} name="password" type="password" autoComplete="current-password" required />
      </label>
      <p className="text-sm">
        <Link href="/forgot-password" className="text-ocean">
          Forgot password
        </Link>
      </p>
      <button className={button} type="submit" disabled={pending || locked}>
        {pending || locked ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState(register, { error: null } satisfies FormState);
  const { locked, guard } = useSubmitLock(state);
  return (
    <form action={(formData) => guard(formData, action)} className="space-y-4">
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
      <fieldset className="space-y-3 border border-line px-3 py-3">
        <legend className="px-1 text-sm">US dollar (stablecoin) wallet</legend>
        <p className="text-xs text-ink/60">
          Public address only. Never paste a seed phrase or a private key. Prize money is not paid while that column is
          blank.
        </p>
        <label className="block text-sm">
          Network
          <select className={field} name="walletNetwork" defaultValue="ethereum">
            <option value="ethereum">Ethereum</option>
            <option value="solana">Solana</option>
            <option value="other">Other stablecoin network</option>
          </select>
        </label>
        <label className="block text-sm">
          Address
          <input className={field} name="walletAddress" autoComplete="off" placeholder="Optional until a payout" />
        </label>
      </fieldset>
      <label className="flex items-start gap-2 text-sm">
        <input className="mt-1" type="checkbox" name="rules" required />
        <span>
          I agree to the{" "}
          <Link href="/rules" className="text-ocean">
            competition rules
          </Link>
          .
        </span>
      </label>
      <label className="flex items-start gap-2 text-sm">
        <input className="mt-1" type="checkbox" name="terms" required />
        <span>
          I agree to the{" "}
          <Link href="/terms" className="text-ocean">
            Terms of Use
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-ocean">
            Privacy Policy
          </Link>
          .
        </span>
      </label>
      <button className={button} type="submit" disabled={pending || locked}>
        {pending || locked ? "Creating…" : "Create account"}
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
  walletNetwork,
  walletAddress,
}: {
  displayName: string;
  city: string;
  club: string;
  country: string;
  bio: string;
  hashtags: string;
  walletNetwork: string;
  walletAddress: string;
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
      <fieldset className="space-y-3 border border-line px-3 py-3">
        <legend className="px-1 text-sm">US dollar (stablecoin) wallet</legend>
        <p className="text-xs text-ink/60">
          Public address only. Never paste a seed phrase or a private key. Prize money is not paid while that column is
          blank.
        </p>
        <label className="block text-sm">
          Network
          <select className={field} name="walletNetwork" defaultValue={walletNetwork || "ethereum"}>
            <option value="ethereum">Ethereum</option>
            <option value="solana">Solana</option>
            <option value="other">Other stablecoin network</option>
          </select>
        </label>
        <label className="block text-sm">
          Address
          <input className={field} name="walletAddress" defaultValue={walletAddress} autoComplete="off" />
        </label>
      </fieldset>
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
  pendingBallots,
  oceanUsed,
  poolChoiceLabel,
  blobUpload = false,
}: {
  themes: ThemeOption[];
  pendingBallots: number;
  oceanUsed: boolean;
  poolChoiceLabel: string;
  /** When set, large files go straight to storage instead of through the server. */
  blobUpload?: boolean;
}) {
  const [state, action, pending] = useActionState(submitEntry, { error: null } satisfies EntryState);
  const [localError, setLocalError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [theme, setTheme] = useState(themes[0]?.slug ?? "");
  const [environment, setEnvironment] = useState<"OCEAN" | "POOL">("OCEAN");
  const [videoUrl, setVideoUrl] = useState("");
  const [spot, setSpot] = useState("");
  const [unpublished, setUnpublished] = useState(false);
  const [terms, setTerms] = useState(false);
  const [, startTransition] = useTransition();
  const busy = pending || uploading;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    setLocalError(null);
    if (videoUrl.trim() && parseVideoUrl(videoUrl) == null) {
      event.preventDefault();
      setLocalError("That link needs to start with http:// or https://.");
      return;
    }
    const form = event.currentTarget;
    const file = (form.elements.namedItem("video") as HTMLInputElement | null)?.files?.[0];
    if (!blobUpload || !file || file.size === 0) return;
    event.preventDefault();
    setLocalError(null);
    setUploading(true);
    try {
      const { upload } = await import("@vercel/blob/client");
      const safeName = file.name.split(/[/\\]/).pop()?.replace(/[^a-zA-Z0-9._-]/g, "") || "wave.mp4";
      const blob = await upload(`waves/${safeName}`, file, {
        access: "public",
        handleUploadUrl: "/api/video-upload",
        contentType: file.type || "video/mp4",
        multipart: file.size > 8 * 1024 * 1024,
      });
      const data = new FormData(form);
      data.delete("video");
      data.set("blobUrl", blob.url);
      startTransition(() => {
        action(data);
      });
    } catch {
      setLocalError("The upload did not finish. Try again, or paste a direct link to the video file.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form action={action} className="space-y-4" onSubmit={handleSubmit}>
      <ErrorNote message={localError ?? state.error} />
      {localError || state.error ? null : pendingBallots > 0 ? (
        <p className="border border-line bg-white px-3 py-2 text-sm">
          {dutyStatusLine(pendingBallots)}{" "}
          <Link href="/judge" className="text-ocean">
            Open the queue
          </Link>
        </p>
      ) : null}
      {localError || state.error ? null : oceanUsed ? (
        <p className="border border-line bg-white px-3 py-2 text-sm">
          This ISO week&apos;s ocean wave is already in. A pool wave can still enter.
        </p>
      ) : null}
      <label className="block text-sm">
        Title in your division
        <select className={field} name="theme" required value={theme} onChange={(event) => setTheme(event.target.value)}>
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
          <input
            className="mr-2"
            type="radio"
            name="environment"
            value="OCEAN"
            checked={environment === "OCEAN"}
            onChange={() => setEnvironment("OCEAN")}
          />
          Ocean · free
        </label>
        <label>
          <input
            className="mr-2"
            type="radio"
            name="environment"
            value="POOL"
            checked={environment === "POOL"}
            onChange={() => setEnvironment("POOL")}
          />
          {poolChoiceLabel}
        </label>
      </fieldset>
      <label className="block text-sm">
        Video file
        <input
          className={field}
          name="video"
          type="file"
          accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.m4v"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file && file.size > 64 * 1024 * 1024) {
              setLocalError("That video is too large. Keep it under 64 MB.");
              event.target.value = "";
              return;
            }
            setLocalError(null);
          }}
        />
      </label>
      <label className="block text-sm">
        Or a video link
        <input
          className={field}
          name="videoUrl"
          type="text"
          inputMode="url"
          placeholder="https://…/wave.mp4"
          value={videoUrl}
          onChange={(event) => setVideoUrl(event.target.value)}
        />
      </label>
      <p className="text-xs text-ink/60">
        MP4, WebM, or MOV, up to 64 MB. A link has to be public, or judges cannot watch it. A private Google Drive file
        will not play. A direct link to a video file is checked the same way. A YouTube or Vimeo page can be entered,
        but we cannot watch it from here, so the desk reviews it.
      </p>
      <label className="block text-sm">
        Break
        <input className={field} name="spot" maxLength={80} value={spot} onChange={(event) => setSpot(event.target.value)} />
      </label>
      <label className="flex items-start gap-2 text-sm">
        <input
          className="mt-1"
          type="checkbox"
          name="unpublished"
          required
          checked={unpublished}
          onChange={(event) => setUnpublished(event.target.checked)}
        />
        <span>This wave has never been posted on any social network or platform.</span>
      </label>
      <label className="flex items-start gap-2 text-sm">
        <input
          className="mt-1"
          type="checkbox"
          name="terms"
          required
          checked={terms}
          onChange={(event) => setTerms(event.target.checked)}
        />
        <span>
          I agree to the{" "}
          <Link href="/terms" className="text-ocean">
            Terms
          </Link>
          .
        </span>
      </label>
      <button className={button} type="submit" disabled={busy || themes.length === 0}>
        {busy ? "Checking the video…" : "Enter wave"}
      </button>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, { error: null, notice: null });
  return (
    <form action={action} className="space-y-4">
      <ErrorNote message={state.error} />
      {state.notice ? <p className="border border-line bg-white px-3 py-2 text-sm">{state.notice}</p> : null}
      <label className="block text-sm">
        Email
        <input className={field} name="email" type="email" autoComplete="email" required />
      </label>
      <button className={button} type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPassword, { error: null, notice: null });
  return (
    <form action={action} className="space-y-4">
      <ErrorNote message={state.error} />
      {state.notice ? <p className="border border-line bg-white px-3 py-2 text-sm">{state.notice}</p> : null}
      <input type="hidden" name="token" value={token} />
      <label className="block text-sm">
        New password
        <input className={field} name="password" type="password" autoComplete="new-password" minLength={8} required />
      </label>
      <label className="block text-sm">
        Confirm password
        <input className={field} name="confirm" type="password" autoComplete="new-password" minLength={8} required />
      </label>
      <button className={button} type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save password"}
      </button>
    </form>
  );
}
