import { describe, expect, it } from "vitest";
import { applyComparison, binaryInsertIndex, probeInsertion, startInsertion } from "@/lib/binary-insertion";
import { collegeSeat, medianCollegePlace, ordinalMedian } from "@/lib/median";

describe("binary insertion", () => {
  it("inserts into an empty board without a comparison", () => {
    expect(binaryInsertIndex(0, () => "better")).toBe(0);
    expect(probeInsertion(startInsertion(0))).toEqual({ kind: "done", index: 0 });
  });

  it("keeps a board ordered when lower means better", () => {
    const board = [2, 5, 9];
    const index = binaryInsertIndex(board.length, (probe) => (4 < board[probe]! ? "better" : "worse"));
    expect(index).toBe(1);
    const next = [...board];
    next.splice(index, 0, 4);
    expect(next).toEqual([2, 4, 5, 9]);
  });

  it("places a wave better than every incumbent first, and a worse one last", () => {
    const board = ["a", "b", "c", "d", "e"];
    expect(binaryInsertIndex(board.length, () => "better")).toBe(0);
    expect(binaryInsertIndex(board.length, () => "worse")).toBe(5);
  });

  it("uses a logarithmic number of comparisons", () => {
    let calls = 0;
    const index = binaryInsertIndex(1_000, (probe) => {
      calls += 1;
      return probe < 700 ? "worse" : "better";
    });
    expect(index).toBe(700);
    expect(calls).toBeLessThanOrEqual(10);
  });

  it("steps the same path the loop uses", () => {
    let state = startInsertion(5);
    const seen: number[] = [];
    while (true) {
      const probe = probeInsertion(state);
      if (probe.kind === "done") {
        expect(probe.index).toBe(2);
        break;
      }
      seen.push(probe.index);
      state = applyComparison(state, probe.index, probe.index < 2 ? "worse" : "better");
    }
    expect(seen[0]).toBe(2);
  });
});

describe("five colleges", () => {
  it("takes the median of five placements", () => {
    expect(
      medianCollegePlace([
        { college: "CHAMBER", place: 4 },
        { college: "RANKED", place: 1 },
        { college: "ATHLETES", place: 8 },
        { college: "UPPER", place: 3 },
        { college: "PUBLIC", place: 2 },
      ]),
    ).toBe(3);
  });

  it("ignores abstentions and resolves an even tie toward the Chamber", () => {
    expect(
      medianCollegePlace([
        { college: "CHAMBER", place: 1 },
        { college: "RANKED", place: null },
        { college: "ATHLETES", place: 4 },
        { college: "UPPER", place: null },
        { college: "PUBLIC", place: null },
      ]),
    ).toBe(1);
    expect(
      medianCollegePlace([
        { college: "CHAMBER", place: null },
        { college: "RANKED", place: 1 },
        { college: "ATHLETES", place: 4 },
        { college: "UPPER", place: null },
        { college: "PUBLIC", place: null },
      ]),
    ).toBe(4);
  });

  it("abstains the Ranked college below a quorum of three ballots", () => {
    expect(collegeSeat("RANKED", [1, 4])).toBeNull();
    expect(collegeSeat("RANKED", [1, 4, 2])).toBe(2);
    expect(collegeSeat("CHAMBER", [5])).toBe(5);
    expect(ordinalMedian([1, 2, 3, 4])).toBe(3);
  });
});
