"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { answerGuestDuel, setVoteConfidence, voteCalibration, voteLive, voteSeat, type GuestAnswer } from "@/app/actions/feed";
import { flagPublished, type FlagState } from "@/app/actions/review";
import type { EyeSnapshot } from "@/lib/eye-record";
import type { FeedCard, GuestDuel } from "@/lib/feed";

type Side = "LEFT" | "RIGHT";

function Clip({
  src,
  active,
  onDone,
}: {
  src: string;
  active: boolean;
  onDone: () => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    const node = ref.current;
    if (!node || !active) return;
    node.muted = true;
    node.currentTime = 0;
    const play = node.play();
    if (play) play.catch(() => undefined);
  }, [active, src]);

  return (
    <video
      ref={ref}
      className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${active ? "opacity-100" : "pointer-events-none opacity-0"}`}
      src={src}
      muted
      playsInline
      autoPlay={active}
      preload="auto"
      onEnded={() => {
        if (active) done.current();
      }}
      onError={() => {
        if (!active) return;
        window.setTimeout(() => done.current(), 2800);
      }}
    />
  );
}

function VoteButtons({
  unlocked,
  busy,
  onPick,
}: {
  unlocked: boolean;
  busy: boolean;
  onPick: (side: Side) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {(["LEFT", "RIGHT"] as const).map((side) => (
        <button
          key={side}
          type="button"
          disabled={!unlocked || busy}
          onClick={() => onPick(side)}
          className="min-h-14 bg-[#f4efe6] text-lg text-[#07161c] disabled:bg-[#f4efe6]/25 disabled:text-[#f4efe6]/70"
        >
          {side === "LEFT" ? "A goes higher" : "B goes higher"}
        </button>
      ))}
    </div>
  );
}

function ReportWave({ ballotId }: { ballotId: string }) {
  const [state, action, pending] = useActionState(flagPublished, { error: null, sent: false } satisfies FlagState);
  if (state.sent) return <p className="text-center text-xs text-[#e6d3b0]">Sent to the desk.</p>;
  return (
    <form action={action} className="text-center">
      <input type="hidden" name="ballotId" value={ballotId} />
      <input type="hidden" name="note" value="Seen this wave before" />
      {state.error ? <p className="mb-1 text-xs text-[#e7b4b4]">{state.error}</p> : null}
      <button className="text-xs tracking-wide text-[#f4efe6]/70 underline-offset-4 hover:underline" type="submit" disabled={pending}>
        Seen this wave before
      </button>
    </form>
  );
}

function Chrome({
  eye,
  label,
}: {
  eye: EyeSnapshot | null;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 pt-4 text-xs uppercase tracking-[0.18em]">
      <Link href="/lineup" className="text-[#e6d3b0]">
        The Lineup
      </Link>
      <p>{label}</p>
      <Link href="/eye" className="text-[#f4efe6]/80">
        {eye ? `${eye.level} · ${eye.score}` : "Eye"}
      </Link>
    </div>
  );
}

export function JudgeFeed({
  initial,
  eye,
  quorum = 7,
}: {
  initial: FeedCard;
  eye: EyeSnapshot | null;
  quorum?: number;
}) {
  const [card, setCard] = useState(initial);
  const [showing, setShowing] = useState<"A" | "B">("A");
  const [seenA, setSeenA] = useState(false);
  const [seenB, setSeenB] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [score, setScore] = useState(eye);
  const [confidence, setConfidence] = useState<{ commitId: string; card: FeedCard } | null>(null);

  const token = card.kind === "idle" ? "idle" : card.kind === "seat" ? card.ballotId : card.kind === "live" ? `${card.ballotId}:${card.leftSrc}` : card.duelId;

  useEffect(() => {
    setShowing("A");
    setSeenA(false);
    setSeenB(false);
    setNote(null);
  }, [token]);

  async function pick(side: Side) {
    if (busy) return;
    setBusy(true);
    try {
      if (card.kind === "live") {
        const result = await voteLive(card.ballotId, side === "LEFT" ? "left" : "right");
        if (result.eye) setScore(result.eye);
        if (result.commitId) setConfidence({ commitId: result.commitId, card: result.card });
        else {
          if (result.sealed) setNote("In your list.");
          setCard(result.card);
        }
      } else if (card.kind === "calibration") {
        const result = await voteCalibration(card.duelId, side);
        setNote(result.correct ? "That's the higher wave." : "The key says the other one.");
        if (result.eye) setScore(result.eye);
        window.setTimeout(() => setCard(result.card), 700);
      }
    } finally {
      setBusy(false);
    }
  }

  async function mark(value: "CONFIDENT" | "UNSURE") {
    if (!confidence || busy) return;
    setBusy(true);
    try {
      await setVoteConfidence(confidence.commitId, value);
      setCard(confidence.card);
      setConfidence(null);
    } finally {
      setBusy(false);
    }
  }

  async function seat() {
    if (card.kind !== "seat" || busy) return;
    setBusy(true);
    try {
      const result = await voteSeat(card.ballotId);
      if (result.eye) setScore(result.eye);
      setNote(result.sealed ? "First place. Sealed." : "That place was not saved.");
      setCard(result.card);
    } finally {
      setBusy(false);
    }
  }

  if (card.kind === "idle") {
    return (
      <section className="fixed inset-0 z-50 flex flex-col bg-[#07161c] text-[#f4efe6]">
        <Chrome eye={score} label="Judge" />
        <div className="flex flex-1 flex-col justify-end px-6 pb-16">
          <p className="text-xs uppercase tracking-[0.22em] text-[#e6d3b0]">Nothing assigned</p>
          <h1 className="mt-3 font-serif text-5xl leading-none">The water is quiet.</h1>
          <p className="mt-4 max-w-sm text-[#f4efe6]/75">No unjudged wave is on your desk. Come back when the next one lands, or watch the waves that already have a verdict.</p>
          <Link href="/lineup" className="mt-8 inline-flex min-h-12 items-center bg-[#f4efe6] px-5 text-[#07161c]">
            Open The Lineup
          </Link>
        </div>
      </section>
    );
  }

  const leftSrc = card.kind === "seat" ? card.src : card.leftSrc;
  const rightSrc = card.kind === "live" || card.kind === "calibration" ? card.rightSrc : "";
  const unlocked = card.kind === "seat" ? seenA : seenA && seenB;

  return (
    <section className="fixed inset-0 z-50 flex flex-col bg-[#07161c] text-[#f4efe6]">
      <Chrome eye={score} label={card.kind === "calibration" ? "Eye check" : "Blind"} />
      <div className="relative min-h-0 flex-1">
        <Clip
          src={leftSrc}
          active={showing === "A"}
          onDone={() => {
            setSeenA(true);
            if (card.kind !== "seat") setShowing("B");
          }}
        />
        {rightSrc ? (
          <Clip
            src={rightSrc}
            active={showing === "B"}
            onDone={() => setSeenB(true)}
          />
        ) : null}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#07161c]/80 to-transparent" />
        <p className="pointer-events-none absolute left-4 top-4 font-serif text-6xl">{showing}</p>
        <p className="pointer-events-none absolute inset-x-0 bottom-4 text-center text-xs uppercase tracking-[0.22em] text-[#f4efe6]/80">
          {card.kind === "calibration" ? "Which wave goes higher?" : "Which wave goes higher?"}
        </p>
      </div>
      <div className="space-y-2 px-3 pb-5 pt-3">
        {note ? <p className="text-center font-serif text-2xl text-[#e6d3b0]">{note}</p> : null}
        {!unlocked ? (
          <p className="text-center text-xs text-[#f4efe6]/60">
            {showing === "A" ? "Watch A through." : "Watch B through. Then the vote opens."}
          </p>
        ) : null}
        {confidence ? (
          <>
            <p className="text-center font-serif text-2xl">How sure was that?</p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" disabled={busy} onClick={() => mark("CONFIDENT")} className="min-h-14 bg-[#f4efe6] text-[#07161c]">
                Confident
              </button>
              <button type="button" disabled={busy} onClick={() => mark("UNSURE")} className="min-h-14 border border-[#f4efe6]/50">
                Unsure
              </button>
            </div>
          </>
        ) : card.kind === "seat" ? (
          <button type="button" disabled={!unlocked || busy} onClick={seat} className="min-h-14 w-full bg-[#f4efe6] text-[#07161c] disabled:opacity-40">
            Place it first
          </button>
        ) : (
          <VoteButtons unlocked={unlocked} busy={busy} onPick={pick} />
        )}
        {card.kind === "live" ? <ReportWave ballotId={card.ballotId} /> : null}
        {card.kind !== "seat" ? (
          <div className="flex justify-center gap-4 text-xs text-[#f4efe6]/60">
            <button type="button" onClick={() => setShowing("A")}>
              Replay A
            </button>
            <button type="button" onClick={() => seenA && setShowing("B")}>
              Replay B
            </button>
          </div>
        ) : null}
        <p className="text-center text-[11px] text-[#f4efe6]/45">
          {card.pending} still on your desk. Monday ranks a wave after {quorum} calibrated judges in its title.
        </p>
      </div>
    </section>
  );
}

export function GuestEye({ duels }: { duels: GuestDuel[] }) {
  const [index, setIndex] = useState(0);
  const [showing, setShowing] = useState<"A" | "B">("A");
  const [seenA, setSeenA] = useState(false);
  const [seenB, setSeenB] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [result, setResult] = useState<GuestAnswer | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const duel = duels[index];

  useEffect(() => {
    setShowing("A");
    setSeenA(false);
    setSeenB(false);
  }, [index]);

  if (dismissed) return null;

  if (duels.length === 0) {
    return (
      <section className="fixed inset-0 z-50 flex flex-col justify-end bg-[#07161c] px-6 pb-16 text-[#f4efe6]">
        <p className="text-xs uppercase tracking-[0.22em] text-[#e6d3b0]">Try your eye</p>
        <h1 className="mt-3 font-serif text-5xl leading-none">The key is still being set.</h1>
        <p className="mt-4 max-w-sm text-[#f4efe6]/75">Three duels, about twenty seconds, once the pros lock an answer. You can still create an account.</p>
        <Link href="/sign-up" className="mt-8 inline-flex min-h-12 w-fit items-center bg-[#f4efe6] px-5 text-[#07161c]">
          Sign up
        </Link>
      </section>
    );
  }

  if (result?.done) {
    return (
      <section className="fixed inset-0 z-50 flex flex-col justify-end bg-[#07161c] px-6 pb-16 text-[#f4efe6]">
        <p className="text-xs uppercase tracking-[0.22em] text-[#e6d3b0]">Your eye</p>
        <h1 className="mt-3 font-serif text-6xl leading-none">{result.score}</h1>
        <p className="mt-2 font-serif text-3xl text-[#e6d3b0]">{result.level}</p>
        <p className="mt-4 max-w-sm text-[#f4efe6]/75">
          {result.answered} duels. {result.score >= 70 ? "You can see the difference." : "The water will teach the rest."} Sign up and the unjudged waves are waiting.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link href="/sign-up" className="inline-flex min-h-12 items-center justify-center bg-[#f4efe6] px-5 text-[#07161c]">
            Sign up and judge
          </Link>
          <Link href="/sign-in" className="text-center text-sm text-[#e6d3b0]">
            I already have an account
          </Link>
          <button type="button" className="text-center text-sm text-[#f4efe6]/70" onClick={() => setDismissed(true)}>
            See the rankings
          </button>
        </div>
      </section>
    );
  }

  if (!duel) return null;
  const unlocked = seenA && seenB;

  async function pick(side: Side) {
    if (!duel || busy) return;
    setBusy(true);
    try {
      const answer = await answerGuestDuel(duel.id, side);
      if (!answer) return;
      setNote(answer.correct ? "That's the higher wave." : "The key says the other one.");
      setResult(answer);
      if (!answer.done) {
        window.setTimeout(() => {
          setIndex((current) => current + 1);
          setNote(null);
        }, 650);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="fixed inset-0 z-50 flex flex-col bg-[#07161c] text-[#f4efe6]">
      <div className="flex items-center justify-between px-4 pt-4 text-xs uppercase tracking-[0.18em]">
        <button type="button" className="text-[#e6d3b0]" onClick={() => setDismissed(true)}>
          Rankings
        </button>
        <span>
          {index + 1} / {duels.length}
        </span>
        <Link href="/sign-up">Sign up</Link>
      </div>
      <div className="relative min-h-0 flex-1">
        <div className="absolute inset-0">
          <Clip src={duel.leftSrc} active={showing === "A"} onDone={() => { setSeenA(true); setShowing("B"); }} />
          <Clip src={duel.rightSrc} active={showing === "B"} onDone={() => setSeenB(true)} />
        </div>
        <p className="pointer-events-none absolute left-4 top-4 font-serif text-6xl">{showing}</p>
      </div>
      <div className="space-y-2 px-3 pb-6 pt-3">
        <p className="text-center font-serif text-2xl">Which wave goes higher?</p>
        {note ? <p className="text-center text-sm text-[#e6d3b0]">{note}</p> : null}
        {!unlocked ? <p className="text-center text-xs text-[#f4efe6]/60">{showing === "A" ? "Watch A through." : "Watch B through."}</p> : null}
        <VoteButtons unlocked={unlocked} busy={busy} onPick={pick} />
      </div>
    </section>
  );
}
