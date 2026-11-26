"use client";

import { useState } from "react";
import { hashReceiptLine, rootFromHashes } from "@/app/actions/verify";

const field = "mt-1 w-full border border-line bg-white px-3 py-2 font-mono text-xs";

export function VerifyDesk() {
  const [line, setLine] = useState("");
  const [hash, setHash] = useState<string | null>(null);
  const [hashes, setHashes] = useState("");
  const [root, setRoot] = useState<string | null>(null);

  return (
    <div className="mt-8 space-y-8">
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          void hashReceiptLine(line).then(setHash);
        }}
      >
        <h2 className="font-serif text-3xl">Hash one vote</h2>
        <label className="block text-sm">
          Canonical line
          <textarea className={field} rows={4} value={line} onChange={(event) => setLine(event.target.value)} />
        </label>
        <button className="min-h-12 bg-ocean px-4 text-paper" type="submit">
          Hash it
        </button>
        {hash ? <p className="break-all font-mono text-xs">{hash}</p> : null}
      </form>
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          void rootFromHashes(hashes).then(setRoot);
        }}
      >
        <h2 className="font-serif text-3xl">Weekly root</h2>
        <label className="block text-sm">
          One hash per line
          <textarea className={field} rows={6} value={hashes} onChange={(event) => setHashes(event.target.value)} />
        </label>
        <button className="min-h-12 bg-ocean px-4 text-paper" type="submit">
          Build the root
        </button>
        {root ? <p className="break-all font-mono text-xs">{root}</p> : null}
      </form>
    </div>
  );
}
