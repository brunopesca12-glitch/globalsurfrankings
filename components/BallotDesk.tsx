"use client";

import { useEffect, useState } from "react";
import { castComparison, sealPlacement, undoComparison } from "@/app/actions/ballot";

export function BallotDesk({
  ballotId,
  mode,
  step,
  canUndo,
}: {
  ballotId: string;
  mode: "compare" | "seat";
  step: number;
  canUndo: boolean;
}) {
  const [side, setSide] = useState<"drawn" | "board">("drawn");
  const drawn = `/judge/media/${ballotId}/drawn`;
  const board = `/judge/media/${ballotId}/board`;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      const key = event.key.toLowerCase();
      if (key === "u" && canUndo) {
        event.preventDefault();
        const form = document.getElementById("undo-ballot") as HTMLFormElement | null;
        form?.requestSubmit();
      }
      if (mode === "seat" && key === "enter") {
        event.preventDefault();
        const form = document.getElementById("seal-ballot") as HTMLFormElement | null;
        form?.requestSubmit();
      }
      if (mode === "compare" && (key === "arrowleft" || key === "b")) {
        event.preventDefault();
        (document.getElementById("vote-better") as HTMLFormElement | null)?.requestSubmit();
      }
      if (mode === "compare" && (key === "arrowright" || key === "w")) {
        event.preventDefault();
        (document.getElementById("vote-worse") as HTMLFormElement | null)?.requestSubmit();
      }
      if (key === "1") setSide("drawn");
      if (key === "2" && mode === "compare") setSide("board");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canUndo, mode]);

  return (
    <div className="pb-28">
      <p className="text-sm text-ink/60">Comparison {step}. The athlete and the category stay hidden.</p>
      {mode === "compare" ? (
        <div className="mt-4 flex gap-2 md:hidden">
          <button
            className={`min-h-11 flex-1 border px-3 py-2 text-sm ${side === "drawn" ? "border-ocean bg-ocean text-paper" : "border-line bg-white"}`}
            type="button"
            onClick={() => setSide("drawn")}
          >
            New wave
          </button>
          <button
            className={`min-h-11 flex-1 border px-3 py-2 text-sm ${side === "board" ? "border-ocean bg-ocean text-paper" : "border-line bg-white"}`}
            type="button"
            onClick={() => setSide("board")}
          >
            Board wave
          </button>
        </div>
      ) : null}

      <div className={`mt-4 grid gap-4 ${mode === "compare" ? "md:grid-cols-2" : ""}`}>
        <figure className={mode === "compare" && side !== "drawn" ? "hidden md:block" : ""}>
          <figcaption className="mb-2 text-xs uppercase tracking-wider text-ink/60">New wave</figcaption>
          <video key={`${ballotId}-drawn-${step}`} className="aspect-video w-full bg-ocean" controls playsInline preload="metadata" src={drawn} />
        </figure>
        {mode === "compare" ? (
          <figure className={side !== "board" ? "hidden md:block" : ""}>
            <figcaption className="mb-2 text-xs uppercase tracking-wider text-ink/60">Wave already on the board</figcaption>
            <video key={`${ballotId}-board-${step}`} className="aspect-video w-full bg-ocean" controls playsInline preload="metadata" src={board} />
          </figure>
        ) : null}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-2">
          {mode === "compare" ? (
            <>
              <p className="text-center font-serif text-2xl">Which wave is better?</p>
              <div className="grid grid-cols-2 gap-2">
                <form id="vote-better" action={castComparison}>
                  <input type="hidden" name="ballotId" value={ballotId} />
                  <input type="hidden" name="comparison" value="better" />
                  <button className="min-h-14 w-full bg-ocean px-3 py-3 text-paper" type="submit">
                    New wave
                  </button>
                </form>
                <form id="vote-worse" action={castComparison}>
                  <input type="hidden" name="ballotId" value={ballotId} />
                  <input type="hidden" name="comparison" value="worse" />
                  <button className="min-h-14 w-full border border-ocean bg-white px-3 py-3" type="submit">
                    Board wave
                  </button>
                </form>
              </div>
              <p className="text-center text-xs text-ink/50">Keys: B better · W worse · 1 and 2 switch waves · U undo</p>
            </>
          ) : (
            <form id="seal-ballot" action={sealPlacement}>
              <p className="text-center font-serif text-2xl">This board is empty. Seal the wave into first place.</p>
              <input type="hidden" name="ballotId" value={ballotId} />
              <button className="mt-2 min-h-14 w-full bg-ocean px-3 py-3 text-paper" type="submit">
                Seal first place
              </button>
            </form>
          )}
          {canUndo ? (
            <form id="undo-ballot" action={undoComparison}>
              <input type="hidden" name="ballotId" value={ballotId} />
              <button className="min-h-11 w-full text-sm text-ink/70" type="submit">
                Undo last comparison
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  );
}
