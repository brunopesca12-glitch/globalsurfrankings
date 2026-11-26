"use client";

import Link from "next/link";
import { useState } from "react";
import { toggleFollow, toggleShaka } from "@/app/actions/lineup";

export function LineupActions({
  entryId,
  athleteId,
  shakaOn,
  shakaCount,
  following,
  self,
  signedIn,
  shareHref,
}: {
  entryId: string;
  athleteId: string;
  shakaOn: boolean;
  shakaCount: number;
  following: boolean;
  self: boolean;
  signedIn: boolean;
  shareHref: string;
}) {
  const [shaka, setShaka] = useState({ on: shakaOn, count: shakaCount });
  const [follow, setFollow] = useState(following);
  const [busy, setBusy] = useState(false);

  if (!signedIn) {
    return (
      <div className="mt-5 flex items-center gap-3 text-sm">
        <Link href="/sign-in" className="min-h-11 border border-[#f4efe6]/40 px-4 py-2">
          Shaka
        </Link>
        <Link href={shareHref} className="min-h-11 px-2 py-2 text-[#e6d3b0]">
          Story
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
      <button
        type="button"
        disabled={busy}
        className={`min-h-11 px-4 py-2 ${shaka.on ? "bg-[#f4efe6] text-[#07161c]" : "border border-[#f4efe6]/40"}`}
        onClick={() => {
          setBusy(true);
          toggleShaka(entryId)
            .then((next) => {
              if (next) setShaka(next);
            })
            .finally(() => setBusy(false));
        }}
      >
        Shaka {shaka.count > 0 ? shaka.count : ""}
      </button>
      {self ? null : (
        <button
          type="button"
          disabled={busy}
          className="min-h-11 border border-[#f4efe6]/40 px-4 py-2"
          onClick={() => {
            setBusy(true);
            toggleFollow(athleteId)
              .then((next) => {
                if (next) setFollow(next.on);
              })
              .finally(() => setBusy(false));
          }}
        >
          {follow ? "Following" : "Follow"}
        </button>
      )}
      <Link href={shareHref} className="min-h-11 px-3 py-2 text-[#e6d3b0]">
        Story
      </Link>
    </div>
  );
}
