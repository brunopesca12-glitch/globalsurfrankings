/** Waves a judge may be assigned, shown, and allowed to submit. Placed waves stay in play. */
export const JUDGEABLE_ENTRY_STATUSES = ["SUBMITTED", "PLACED"] as const;

export function isJudgeableEntryStatus(status: string): boolean {
  return status === "SUBMITTED" || status === "PLACED";
}

export type DeskBallotView<T> = {
  ballot: T;
  status: string;
  entryStatus: string;
  current: boolean;
};

/**
 * Open ballots on the judge's desk. Earlier weeks come first, then this week.
 * A wave that already has a place is included: assignment can target it.
 */
export function visibleOpenBallots<T>(week: readonly DeskBallotView<T>[], earlier: readonly DeskBallotView<T>[]): T[] {
  return [...earlier, ...week]
    .filter((row) => row.status === "OPEN" && isJudgeableEntryStatus(row.entryStatus) && row.current)
    .map((row) => row.ballot);
}

/** An open ballot can be submitted when its wave is still submitted or already placed. */
export function canSubmitOpenBallot(ballot: { status: string; entryStatus: string } | null): boolean {
  return ballot != null && ballot.status === "OPEN" && isJudgeableEntryStatus(ballot.entryStatus);
}
