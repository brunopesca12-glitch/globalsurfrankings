export type Comparison = "better" | "worse";

export type InsertionState = {
  lo: number;
  hi: number;
};

export type Probe =
  | { kind: "done"; index: number }
  | { kind: "probe"; index: number; lo: number; hi: number };

export function startInsertion(boardLength: number): InsertionState {
  if (!Number.isInteger(boardLength) || boardLength < 0) {
    throw new Error("boardLength must be a non-negative integer");
  }
  return { lo: 0, hi: boardLength };
}

export function probeInsertion(state: InsertionState): Probe {
  if (state.lo >= state.hi) return { kind: "done", index: state.lo };
  const index = Math.floor((state.lo + state.hi) / 2);
  return { kind: "probe", index, lo: state.lo, hi: state.hi };
}

export function applyComparison(state: InsertionState, probeIndex: number, result: Comparison): InsertionState {
  if (result === "better") return { lo: state.lo, hi: probeIndex };
  return { lo: probeIndex + 1, hi: state.hi };
}

/**
 * Place a new entry on an ordered board (index 0 is best) by binary insertion.
 * `compare(index)` says whether the newcomer is better or worse than the
 * incumbent already sitting at that index. Comparisons are strict.
 */
export function binaryInsertIndex(boardLength: number, compare: (index: number) => Comparison): number {
  let state = startInsertion(boardLength);
  while (true) {
    const probe = probeInsertion(state);
    if (probe.kind === "done") return probe.index;
    state = applyComparison(state, probe.index, compare(probe.index));
  }
}
