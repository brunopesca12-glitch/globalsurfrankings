"use client";

import { useState } from "react";
import { placeWave } from "@/app/actions/ballot";
import { confirmPlaceCopy } from "@/lib/stack";

export type StackTile = { rank: number; entryId: string };

export function PlaceBoard({
  ballotId,
  incomingSrc,
  eventLine,
  tiles,
}: {
  ballotId: string;
  incomingSrc: string;
  eventLine: string;
  tiles: StackTile[];
}) {
  const [playing, setPlaying] = useState({ src: incomingSrc, label: "New wave" });
  const [over, setOver] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<number | null>(null);
  const incoming = playing.src === incomingSrc;

  function ask(place: number) {
    setConfirm(place);
    setOver(null);
  }

  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
      <section className="order-1 lg:order-2">
        <p className="text-sm text-ink/70">{eventLine}</p>
        <h1 className="mt-1 font-serif text-4xl">{playing.label}</h1>
        <video
          key={playing.src}
          className="mt-4 aspect-video w-full bg-ocean"
          controls
          playsInline
          preload="metadata"
          src={playing.src}
        />
        {!incoming ? (
          <button className="mt-3 text-sm text-ocean" type="button" onClick={() => setPlaying({ src: incomingSrc, label: "New wave" })}>
            Back to the new wave
          </button>
        ) : (
          <div
            className="mt-4 flex min-h-16 cursor-grab items-center justify-between border border-ocean bg-white px-4 py-3 active:cursor-grabbing"
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData("text/plain", "new-wave");
              event.dataTransfer.effectAllowed = "move";
            }}
          >
            <span className="font-medium">New wave</span>
            <span className="text-sm text-ink/60">Drag into your list</span>
          </div>
        )}
        {tiles.length === 0 ? (
          <form action={placeWave} className="mt-4">
            <input type="hidden" name="ballotId" value={ballotId} />
            <input type="hidden" name="place" value="1" />
            <button className="min-h-14 w-full bg-ocean px-4 py-3 text-paper" type="submit">
              Set as #1
            </button>
          </form>
        ) : null}
      </section>

      <aside className="order-2 lg:order-1">
        <p className="text-xs uppercase tracking-[0.18em] text-ink/50">Your list · {tiles.length}</p>
        <ol className="mt-3">
          <Gap
            place={1}
            active={over === 1}
            showButton={tiles.length > 0}
            onAsk={() => ask(1)}
            onOver={() => setOver(1)}
            onLeave={() => setOver((current) => (current === 1 ? null : current))}
          />
          {tiles.map((tile) => (
            <li key={tile.entryId}>
              <button
                className="flex w-full items-center gap-3 border border-line bg-white px-2 py-2 text-left"
                type="button"
                onClick={() =>
                  setPlaying({ src: `/judge/media/stack/${tile.entryId}`, label: `Your #${tile.rank}` })
                }
              >
                <span className="w-8 font-serif text-2xl">{tile.rank}</span>
                <video
                  className="h-12 w-20 bg-ocean object-cover"
                  muted
                  playsInline
                  preload="metadata"
                  src={`/judge/media/stack/${tile.entryId}`}
                />
              </button>
              <Gap
                place={tile.rank + 1}
                active={over === tile.rank + 1}
                showButton
                onAsk={() => ask(tile.rank + 1)}
                onOver={() => setOver(tile.rank + 1)}
                onLeave={() => setOver((current) => (current === tile.rank + 1 ? null : current))}
              />
            </li>
          ))}
        </ol>
      </aside>

      {confirm != null ? (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-ink/40 p-4 sm:items-center">
          <form action={placeWave} className="w-full max-w-md bg-paper p-5 shadow-lg">
            <p className="font-serif text-3xl">{confirmPlaceCopy(confirm, tiles.length)}</p>
            <input type="hidden" name="ballotId" value={ballotId} />
            <input type="hidden" name="place" value={confirm} />
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button className="min-h-12 border border-line" type="button" onClick={() => setConfirm(null)}>
                Cancel
              </button>
              <button className="min-h-12 bg-ocean text-paper" type="submit">
                Place it
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function Gap({
  place,
  active,
  showButton,
  onAsk,
  onOver,
  onLeave,
}: {
  place: number;
  active: boolean;
  showButton: boolean;
  onAsk: () => void;
  onOver: () => void;
  onLeave: () => void;
}) {
  return (
    <div
      className={`my-1 min-h-8 border-t-2 ${active ? "border-ocean" : "border-transparent"}`}
      onDragOver={(event) => {
        event.preventDefault();
        onOver();
      }}
      onDragLeave={onLeave}
      onDrop={(event) => {
        event.preventDefault();
        onAsk();
      }}
    >
      {showButton ? (
        <button className="min-h-11 w-full text-sm text-ocean lg:hidden" type="button" onClick={onAsk}>
          Place here · #{place}
        </button>
      ) : null}
    </div>
  );
}
