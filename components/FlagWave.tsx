"use client";

import { useActionState } from "react";
import { flagPublished, type FlagState } from "@/app/actions/review";

export function FlagWave({ entryId, ballotId }: { entryId?: string; ballotId?: string }) {
  const [state, action, pending] = useActionState(flagPublished, { error: null, sent: false } satisfies FlagState);
  if (state.sent) {
    return <p className="text-sm text-ocean">Report sent. The desk will look at whether this wave was already posted.</p>;
  }
  return (
    <form action={action} className="space-y-2">
      {state.error ? <p className="text-sm text-stamp">{state.error}</p> : null}
      {entryId ? <input type="hidden" name="entryId" value={entryId} /> : null}
      {ballotId ? <input type="hidden" name="ballotId" value={ballotId} /> : null}
      <label className="block text-sm">
        Seen this wave posted online before?
        <input className="mt-1 w-full border border-line bg-white px-3 py-2" name="note" maxLength={500} placeholder="Where you saw it, if you remember" />
      </label>
      <button className="border border-line px-3 py-2 text-sm" type="submit" disabled={pending}>
        {pending ? "Sending…" : "Report it to the desk"}
      </button>
    </form>
  );
}
