"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import { insertAtPlace, type JudgeState } from "@/app/actions/judging";
import { applyComparison, probeInsertion, startInsertion, type Comparison } from "@/lib/binary-insertion";
import { ordinal } from "@/lib/format";

export function BinaryInsert({
  entryId,
  athlete,
  board,
}: {
  entryId: string;
  athlete: string;
  board: { place: number; name: string }[];
}) {
  const [state, setState] = useState(() => startInsertion(board.length));
  const [steps, setSteps] = useState(0);
  const probe = useMemo(() => probeInsertion(state), [state]);
  const [result, action, pending] = useActionState(insertAtPlace, { error: null, saved: false } satisfies JudgeState);

  function answer(comparison: Comparison) {
    if (probe.kind !== "probe") return;
    setState((current) => applyComparison(current, probe.index, comparison));
    setSteps((count) => count + 1);
  }

  const place = probe.kind === "done" ? probe.index + 1 : null;

  return (
    <div className="border border-line bg-white p-4">
      <p className="text-sm text-ink/70">
        Binary insertion · {athlete} · {steps === 1 ? "1 comparison" : `${steps} comparisons`}
      </p>
      {probe.kind === "probe" ? (
        <div className="mt-3">
          <p>
            Is the new wave better or worse than <strong>{board[probe.index]?.name}</strong>, currently{" "}
            {ordinal(board[probe.index]!.place)}?
          </p>
          <div className="mt-3 flex gap-2">
            <button type="button" className="border border-ocean px-3 py-1.5 text-sm" onClick={() => answer("better")}>
              Better
            </button>
            <button type="button" className="border border-line px-3 py-1.5 text-sm" onClick={() => answer("worse")}>
              Worse
            </button>
          </div>
        </div>
      ) : (
        <form action={action} className="mt-3 space-y-2">
          <p>
            Ordinal place: <strong>{place ? ordinal(place) : "—"}</strong>
          </p>
          <input type="hidden" name="entryId" value={entryId} />
          <input type="hidden" name="place" value={place ?? 1} />
          {result.error ? <p className="text-sm text-stamp">{result.error}</p> : null}
          {result.saved ? <p className="text-sm text-ocean">Placement published.</p> : null}
          <button className="bg-ocean px-3 py-1.5 text-sm text-paper" type="submit" disabled={pending}>
            Publish on the board
          </button>
        </form>
      )}
    </div>
  );
}

export function DirectPlaceForm({ entryId, maxPlace }: { entryId: string; maxPlace: number }) {
  const [result, action, pending] = useActionState(insertAtPlace, { error: null, saved: false } satisfies JudgeState);
  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="entryId" value={entryId} />
      <label className="text-sm">
        Place
        <input
          className="mt-1 block w-20 border border-line bg-white px-2 py-1"
          name="place"
          type="number"
          min={1}
          max={maxPlace}
          defaultValue={maxPlace}
          required
        />
      </label>
      <button className="border border-ocean px-3 py-1.5 text-sm" type="submit" disabled={pending}>
        Set
      </button>
      {result.error ? <span className="text-sm text-stamp">{result.error}</span> : null}
      {result.saved ? <span className="text-sm text-ocean">Published.</span> : null}
    </form>
  );
}
