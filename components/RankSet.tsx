"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { saveRanking } from "@/app/actions/ballot";
import type { RankCard } from "@/lib/comparison";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button className="mt-6 min-h-14 w-full bg-ocean px-4 py-3 text-paper disabled:opacity-60 sm:w-auto" type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save this ranking"}
    </button>
  );
}

export function RankSet({
  ballotId,
  eventLine,
  cards,
  fresh,
  already,
  compared,
}: {
  ballotId: string;
  eventLine: string;
  cards: RankCard[];
  fresh: number;
  already: number;
  compared: number;
}) {
  const [order, setOrder] = useState(cards.map((card) => card.key));
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const byKey = new Map(cards.map((card) => [card.key, card]));

  function move(index: number, direction: -1 | 1) {
    const next = index + direction;
    if (next < 0 || next >= order.length) return;
    setOrder((current) => {
      const copy = [...current];
      const [item] = copy.splice(index, 1);
      copy.splice(next, 0, item!);
      return copy;
    });
  }

  return (
    <form action={saveRanking}>
      <p className="text-sm text-ink/70">{eventLine}</p>
      <h1 className="mt-1 font-serif text-4xl">Rank these waves</h1>
      <p className="mt-3 max-w-2xl text-ink/75">
        Put the better wave higher. Names stay hidden.
        {fresh === 1 ? " 1 new wave." : ` ${fresh} new waves.`}
        {already > 0 ? ` ${already} you already ranked ${already === 1 ? "is" : "are"} in the list.` : ""}
        {compared > 0 ? " The other waves are here so you can compare. They are not yours to keep." : ""}
      </p>
      <input type="hidden" name="ballotId" value={ballotId} />
      <input type="hidden" name="order" value={order.join(",")} />
      <ol className="mt-6 grid gap-4 lg:grid-cols-2">
        {order.map((key, index) => {
          const card = byKey.get(key);
          if (!card) return null;
          return (
            <li key={key} className="border border-line bg-white">
              <div className="flex items-center justify-between gap-3 px-3 py-2">
                <p className="font-serif text-2xl">
                  #{index + 1} <span className="text-base text-ink/70">{card.label}</span>
                </p>
                <div className="flex gap-2">
                  <button
                    className="min-h-11 border border-line px-3 text-sm disabled:opacity-40"
                    type="button"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    Better
                  </button>
                  <button
                    className="min-h-11 border border-line px-3 text-sm disabled:opacity-40"
                    type="button"
                    disabled={index === order.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    Worse
                  </button>
                </div>
              </div>
              {failed[key] ? (
                <p className="mx-3 mb-3 border border-line bg-paper px-3 py-6 text-sm text-ink/70">
                  This wave did not play here. A private link cannot be watched inside the site.
                </p>
              ) : (
                <video
                  className="aspect-video w-full bg-ocean"
                  controls
                  playsInline
                  preload="metadata"
                  src={card.src}
                  onError={() => setFailed((current) => ({ ...current, [key]: true }))}
                />
              )}
            </li>
          );
        })}
      </ol>
      <SaveButton />
    </form>
  );
}
