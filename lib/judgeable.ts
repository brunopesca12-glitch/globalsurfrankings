/** A wave can be judged only before Monday publishes its place. A verdict is not reopened. */
export const JUDGEABLE_ENTRY_STATUSES = ["SUBMITTED"] as const;

export function isJudgeableEntryStatus(status: string): boolean {
  return status === "SUBMITTED";
}

export type DeskBallotView<T> = {
  ballot: T;
  status: string;
  entryStatus: string;
  current: boolean;
};

/**
 * Open ballots on the judge's desk. Earlier weeks come first, then this week.
 * A wave that already has a published place is not on the desk.
 */
export function visibleOpenBallots<T>(week: readonly DeskBallotView<T>[], earlier: readonly DeskBallotView<T>[]): T[] {
  return [...earlier, ...week]
    .filter((row) => row.status === "OPEN" && isJudgeableEntryStatus(row.entryStatus) && row.current)
    .map((row) => row.ballot);
}

/** An open ballot can be submitted only while its wave is still waiting for Monday. */
export function canSubmitOpenBallot(ballot: { status: string; entryStatus: string } | null): boolean {
  return ballot != null && ballot.status === "OPEN" && isJudgeableEntryStatus(ballot.entryStatus);
}
