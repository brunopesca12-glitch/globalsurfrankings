import { describe, expect, it } from "vitest";
import {
  appealPanel,
  appealThreshold,
  canonicalVote,
  duelAgreements,
  holdCopy,
  judgePseudonym,
  merkleRoot,
  mondayGate,
  quorumCount,
  sha256Hex,
  verdictQuorum,
  voteHash,
  waveAgreement,
  isOutlier,
} from "@/lib/receipt";

const vote = {
  voteId: "cmp_1",
  subjectId: "wave_a",
  probeId: "wave_b",
  choice: "BETTER" as const,
  pseudonym: "J-ABCDEF01",
  timestamp: "2026-11-26T12:00:00.000Z",
  nonce: "abc123",
};

describe("verdict quorum", () => {
  it("defaults to 7 and reads a later raise from the env", () => {
    expect(verdictQuorum({ ...process.env, GSR_VERDICT_QUORUM: undefined })).toBe(7);
    expect(verdictQuorum({ ...process.env, GSR_VERDICT_QUORUM: "11" })).toBe(11);
    expect(verdictQuorum({ ...process.env, GSR_VERDICT_QUORUM: "nope" })).toBe(7);
    expect(appealThreshold({ ...process.env, GSR_APPEAL_AGREEMENT: undefined })).toBe(0.6);
    expect(appealThreshold({ ...process.env, GSR_APPEAL_AGREEMENT: "0.75" })).toBe(0.75);
  });

  it("counts a judge once, and only when calibrated for that title", () => {
    const judges = [
      { userId: "a", calibrated: true, qualified: true },
      { userId: "a", calibrated: true, qualified: true },
      { userId: "b", calibrated: true, qualified: false },
      { userId: "c", calibrated: false, qualified: true },
      { userId: "d", calibrated: true, qualified: true },
    ];
    expect(quorumCount(judges)).toBe(2);
  });

  it("rolls a short bench to next Monday and ranks once the quorum is in", () => {
    const judges = Array.from({ length: 7 }, (_, index) => ({
      userId: `j${index}`,
      calibrated: true,
      qualified: true,
    }));
    expect(mondayGate({ judges: judges.slice(0, 6), agreement: 1, appealSealed: 0, quorum: 7, threshold: 0.6 })).toBe(
      "quorum",
    );
    expect(mondayGate({ judges, agreement: 0.9, appealSealed: 0, quorum: 7, threshold: 0.6 })).toBe("rank");
    expect(holdCopy("QUORUM", 7)).toContain("rolls to next Monday");
    expect(holdCopy("QUORUM", 7)).toContain("not ranked");
  });
});

describe("appeal routing", () => {
  it("sends a split wave to Golden Eye, then to the highest eyes if that bench is short", () => {
    const judges = Array.from({ length: 7 }, (_, index) => ({
      userId: `j${index}`,
      calibrated: true,
      qualified: true,
    }));
    expect(mondayGate({ judges, agreement: 0.5, appealSealed: 0, quorum: 7, threshold: 0.6 })).toBe("appeal");
    expect(mondayGate({ judges, agreement: 0.5, appealSealed: 7, quorum: 7, threshold: 0.6 })).toBe("rank");

    const bench = [
      { userId: "g1", eye: 96, level: "Golden Eye" },
      { userId: "g2", eye: 91, level: "Golden Eye" },
      { userId: "t1", eye: 88, level: "Tower" },
      { userId: "s1", eye: 10, level: "Shorebreak" },
      { userId: "seen", eye: 99, level: "Golden Eye" },
    ];
    const short = appealPanel(bench, new Set(["seen"]), 4);
    expect(short.fallback).toBe(true);
    expect(short.ids).toEqual(["g1", "g2", "t1", "s1"]);

    const deep = appealPanel(
      Array.from({ length: 8 }, (_, index) => ({ userId: `g${index}`, eye: 99 - index, level: "Golden Eye" })),
      new Set(),
      7,
    );
    expect(deep.fallback).toBe(false);
    expect(deep.ids).toHaveLength(7);
    expect(deep.ids[0]).toBe("g0");
  });

  it("flags a low-agreement duel and an outlier place", () => {
    const duels = duelAgreements([
      { subjectId: "new", probeId: "old", better: 8, worse: 1 },
      { subjectId: "new", probeId: "other", better: 2, worse: 5 },
    ]);
    expect(duels[0]).toMatchObject({ agree: 8, total: 9, majority: "BETTER" });
    expect(waveAgreement(duels, [1, 1, 1, 2])).toBeCloseTo(5 / 7);
    expect(waveAgreement([], [2, 2, 2, 5])).toBeCloseTo(0.75);
    expect(isOutlier({ place: 5, median: 2 })).toBe(true);
    expect(isOutlier({ place: 3, median: 2 })).toBe(false);
  });
});

describe("commit and merkle root", () => {
  it("hashes a canonical vote and rebuilds the weekly root", () => {
    expect(canonicalVote(vote)).toBe("cmp_1|wave_a|wave_b|BETTER|J-ABCDEF01|2026-11-26T12:00:00.000Z|abc123");
    const hash = voteHash(vote);
    expect(hash).toBe(sha256Hex(canonicalVote(vote)));
    expect(hash).toHaveLength(64);

    const other = voteHash({ ...vote, voteId: "cmp_2", choice: "WORSE" });
    const root = merkleRoot([hash, other]);
    expect(root).toBe(merkleRoot([other, hash]));
    const sorted = [hash, other].sort();
    expect(root).toBe(sha256Hex(`${sorted[0]}|${sorted[1]}`));
    expect(merkleRoot([hash])).toBe(hash);
    expect(merkleRoot([])).toBe(sha256Hex(""));

    const three = merkleRoot([hash, other, sha256Hex("c")]);
    expect(three).toHaveLength(64);
    expect(judgePseudonym("user_1")).toBe(judgePseudonym("user_1"));
    expect(judgePseudonym("user_1")).not.toBe(judgePseudonym("user_2"));
    expect(judgePseudonym("user_1")).toMatch(/^J-[0-9A-F]{8}$/);
  });
});
